package com.vacation.platform.corp.corperation.service.impl;

import com.vacation.platform.corp.corperation.entity.CorpStatus;
import com.vacation.platform.corp.corperation.entity.Corporation;
import com.vacation.platform.corp.corperation.entity.room.Room;
import com.vacation.platform.corp.corperation.entity.room.RoomStock;
import com.vacation.platform.corp.corperation.entity.room.RoomStockSummary;
import com.vacation.platform.corp.corperation.entity.room.RoomStockSummaryId;
import com.vacation.platform.corp.corperation.entity.room.RoomUnit;
import com.vacation.platform.corp.corperation.repository.CorporationRepository;
import com.vacation.platform.corp.corperation.repository.RoomRepository;
import com.vacation.platform.corp.corperation.repository.RoomStockRepository;
import com.vacation.platform.corp.corperation.repository.RoomStockSummaryRepository;
import com.vacation.platform.corp.corperation.repository.RoomUnitRepository;
import com.vacation.platform.corp.corperation.service.RoomStockService;
import com.vacation.platform.corp.reservation.dto.ReservationDTO;
import com.vacation.platform.corp.reservation.entity.Reservation;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RoomStockServiceImpl implements RoomStockService {

	private final CorporationRepository corporationRepository;
	private final RoomRepository roomRepository;
	private final RoomUnitRepository roomUnitRepository;
	private final RoomStockRepository roomStockRepository;
	private final RoomStockSummaryRepository roomStockSummaryRepository;
	private final RedissonClient redissonClient;

	public RoomStockServiceImpl(CorporationRepository corporationRepository,
	                            RoomRepository roomRepository,
	                            RoomUnitRepository roomUnitRepository,
	                            RoomStockRepository roomStockRepository,
	                            RoomStockSummaryRepository roomStockSummaryRepository,
	                            RedissonClient redissonClient) {
		this.corporationRepository = corporationRepository;
		this.roomRepository = roomRepository;
		this.roomUnitRepository = roomUnitRepository;
		this.roomStockRepository = roomStockRepository;
		this.roomStockSummaryRepository = roomStockSummaryRepository;
		this.redissonClient = redissonClient;
	}

	@Override
	@Transactional
	public void generateTodayRoomStock() {
		generateRoomStock(LocalDate.now(), LocalDate.now());
	}

	@Override
	@Transactional
	public void generateRollingRoomStock(int days) {
		if (days <= 0) {
			throw new IllegalArgumentException("days must be greater than zero");
		}

		LocalDate startDate = LocalDate.now();
		generateRoomStock(startDate, startDate.plusDays(days - 1L));
	}

	@Override
	@Transactional
	public void generateRoomStock(LocalDate startDate, LocalDate endDate) {
		if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
			throw new IllegalArgumentException("Invalid room stock date range");
		}

		List<Corporation> corporationList = corporationRepository.findByCorpStatus(CorpStatus.REGISTERED);
		for (Corporation corporation : corporationList) {
			List<Room> roomList = roomRepository.findByRoom(corporation.getCorpUserId());
			for (Room room : roomList) {
				List<RoomUnit> roomUnitList = roomUnitRepository.findByRoomId(room.getRoomId());
				for (LocalDate stockDate = startDate; !stockDate.isAfter(endDate); stockDate = stockDate.plusDays(1)) {
					createMissingRoomStocks(roomUnitList, stockDate);
					updateRoomStockSummary(room, roomUnitList.size(), stockDate);
				}
			}
		}
	}

	private void createMissingRoomStocks(List<RoomUnit> roomUnitList, LocalDate stockDate) {
		List<RoomStock> newStocks = new ArrayList<>();
		for (RoomUnit roomUnit : roomUnitList) {
			if (roomStockRepository.findByRoomUnitIdAndStockDate(roomUnit.getRoomUnitId(), stockDate).isEmpty()) {
				RoomStock roomStock = new RoomStock();
				roomStock.setRoomUnit(roomUnit);
				roomStock.setStockDate(stockDate);
				roomStock.setReservation(null);
				newStocks.add(roomStock);
			}
		}

		if (!newStocks.isEmpty()) {
			roomStockRepository.saveAll(newStocks);
		}
	}

	private void updateRoomStockSummary(Room room, int totalStock, LocalDate stockDate) {
		int availableStock = roomStockRepository.countAvailableByRoomIdAndStockDate(room.getRoomId(), stockDate)
				.map(Long::intValue)
				.orElse(0);

		RoomStockSummary summary = roomStockSummaryRepository.findByRoomIdAndStockDate(room.getRoomId(), stockDate)
				.orElseGet(() -> {
					RoomStockSummary newSummary = new RoomStockSummary();
					newSummary.setRoomStockSummaryId(new RoomStockSummaryId(room.getRoomId(), stockDate));
					return newSummary;
				});

		summary.setTotalStock(totalStock);
		summary.setAvailableStock(availableStock);
		roomStockSummaryRepository.save(summary);
	}

	@Override
	@Transactional
	public Map<LocalDate, RoomStock> allocateRoomStocks(ReservationDTO reservationDTO, Reservation reservation) {
		if (reservationDTO.getCheckIn() == null
				|| reservationDTO.getCheckOut() == null
				|| !reservationDTO.getCheckIn().isBefore(reservationDTO.getCheckOut())) {
			throw new IllegalArgumentException("Invalid reservation date range");
		}

		List<RoomUnit> roomUnits = roomUnitRepository.findByRoomId(reservationDTO.getRoomId());
		if (roomUnits.isEmpty()) {
			throw new RuntimeException("No room units exist for roomId: " + reservationDTO.getRoomId());
		}

		for (RoomUnit roomUnit : roomUnits) {
			List<RoomStock> candidateStocks = findAvailableStocksForSameRoomUnit(roomUnit, reservationDTO);
			if (candidateStocks.size() == getReservationDays(reservationDTO)
					&& tryAssignStocks(candidateStocks, reservation)) {
				Map<LocalDate, RoomStock> allocationMap = toAllocationMap(candidateStocks);
				refreshSummaries(allocationMap, roomUnits.size());
				return allocationMap;
			}
		}

		Map<LocalDate, RoomStock> allocationMap = new HashMap<>();
		for (LocalDate date = reservationDTO.getCheckIn(); date.isBefore(reservationDTO.getCheckOut()); date = date.plusDays(1)) {
			boolean allocated = false;
			for (RoomUnit roomUnit : roomUnits) {
				Optional<RoomStock> stockOpt = roomStockRepository
						.findByRoomUnitIdAndStockDateAndReservationIdIsNull(roomUnit.getRoomUnitId(), date);
				if (stockOpt.isPresent()) {
					Optional<RoomStock> assignedStock = tryAssignStock(stockOpt.get(), reservation);
					if (assignedStock.isPresent()) {
						allocationMap.put(date, assignedStock.get());
						allocated = true;
						break;
					}
				}
			}

			if (!allocated) {
				throw new RuntimeException("No available room stock for date: " + date);
			}
		}

		refreshSummaries(allocationMap, roomUnits.size());
		return allocationMap;
	}

	private List<RoomStock> findAvailableStocksForSameRoomUnit(RoomUnit roomUnit, ReservationDTO reservationDTO) {
		List<RoomStock> stocks = new ArrayList<>();
		for (LocalDate date = reservationDTO.getCheckIn(); date.isBefore(reservationDTO.getCheckOut()); date = date.plusDays(1)) {
			Optional<RoomStock> stockOpt = roomStockRepository
					.findByRoomUnitIdAndStockDateAndReservationIdIsNull(roomUnit.getRoomUnitId(), date);
			if (stockOpt.isEmpty()) {
				return stocks;
			}
			stocks.add(stockOpt.get());
		}
		return stocks;
	}

	private long getReservationDays(ReservationDTO reservationDTO) {
		return reservationDTO.getCheckIn().datesUntil(reservationDTO.getCheckOut()).count();
	}

	private boolean tryAssignStocks(List<RoomStock> stocks, Reservation reservation) {
		List<RLock> locks = new ArrayList<>();
		try {
			for (RoomStock stock : stocks) {
				RLock lock = redissonClient.getLock("lock:room_stock:" + stock.getRoomStockId());
				if (!lock.tryLock(10, TimeUnit.SECONDS)) {
					return false;
				}
				locks.add(lock);
			}

			for (RoomStock stock : stocks) {
				Optional<RoomStock> recheckOpt = roomStockRepository.findById(stock.getRoomStockId());
				if (recheckOpt.isEmpty() || recheckOpt.get().getReservation() != null) {
					return false;
				}
			}

			for (RoomStock stock : stocks) {
				stock.setReservation(reservation);
				roomStockRepository.save(stock);
			}
			return true;
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new RuntimeException("Interrupted while locking room stocks", e);
		} finally {
			unlockAll(locks);
		}
	}

	private Optional<RoomStock> tryAssignStock(RoomStock stock, Reservation reservation) {
		RLock lock = redissonClient.getLock("lock:room_stock:" + stock.getRoomStockId());
		try {
			if (!lock.tryLock(10, TimeUnit.SECONDS)) {
				return Optional.empty();
			}

			Optional<RoomStock> recheckOpt = roomStockRepository.findById(stock.getRoomStockId());
			if (recheckOpt.isEmpty() || recheckOpt.get().getReservation() != null) {
				return Optional.empty();
			}

			RoomStock availableStock = recheckOpt.get();
			availableStock.setReservation(reservation);
			return Optional.of(roomStockRepository.save(availableStock));
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new RuntimeException("Interrupted while locking room stock", e);
		} finally {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	private void unlockAll(List<RLock> locks) {
		for (RLock lock : locks) {
			if (lock.isHeldByCurrentThread()) {
				lock.unlock();
			}
		}
	}

	private Map<LocalDate, RoomStock> toAllocationMap(List<RoomStock> stocks) {
		Map<LocalDate, RoomStock> allocationMap = new HashMap<>();
		for (RoomStock stock : stocks) {
			allocationMap.put(stock.getStockDate(), stock);
		}
		return allocationMap;
	}

	private void refreshSummaries(Map<LocalDate, RoomStock> allocationMap, int totalStock) {
		for (RoomStock stock : allocationMap.values()) {
			updateRoomStockSummary(stock.getRoomUnit().getRoom(), totalStock, stock.getStockDate());
		}
	}
}
