package com.vacation.platform.corp.corperation.service.impl;

import com.vacation.platform.corp.corperation.entity.CorpStatus;
import com.vacation.platform.corp.corperation.entity.Corporation;
import com.vacation.platform.corp.corperation.entity.room.Room;
import com.vacation.platform.corp.corperation.entity.room.RoomStock;
import com.vacation.platform.corp.corperation.entity.room.RoomStockSummary;
import com.vacation.platform.corp.corperation.entity.room.RoomUnit;
import com.vacation.platform.corp.corperation.repository.CorporationRepository;
import com.vacation.platform.corp.corperation.repository.RoomRepository;
import com.vacation.platform.corp.corperation.repository.RoomStockRepository;
import com.vacation.platform.corp.corperation.repository.RoomStockSummaryRepository;
import com.vacation.platform.corp.corperation.repository.RoomUnitRepository;
import com.vacation.platform.corp.reservation.dto.ReservationDTO;
import com.vacation.platform.corp.reservation.entity.Reservation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomStockServiceImplTest {

	@Mock
	private CorporationRepository corporationRepository;

	@Mock
	private RoomRepository roomRepository;

	@Mock
	private RoomUnitRepository roomUnitRepository;

	@Mock
	private RoomStockRepository roomStockRepository;

	@Mock
	private RoomStockSummaryRepository roomStockSummaryRepository;

	@Mock
	private RedissonClient redissonClient;

	@Mock
	private RLock lock;

	private RoomStockServiceImpl service;

	@BeforeEach
	void setUp() {
		service = new RoomStockServiceImpl(
				corporationRepository,
				roomRepository,
				roomUnitRepository,
				roomStockRepository,
				roomStockSummaryRepository,
				redissonClient
		);
	}

	@Test
	void generateRoomStockCreatesMissingStocksAndSummariesForDateRange() {
		LocalDate startDate = LocalDate.of(2026, 6, 12);
		LocalDate endDate = startDate.plusDays(1);
		Corporation corporation = corporation(1L);
		Room room = room(10L);
		RoomUnit unitA = roomUnit(100L, room);
		RoomUnit unitB = roomUnit(101L, room);

		when(corporationRepository.findByCorpStatus(CorpStatus.REGISTERED)).thenReturn(List.of(corporation));
		when(roomRepository.findByRoom(1L)).thenReturn(List.of(room));
		when(roomUnitRepository.findByRoomId(10L)).thenReturn(List.of(unitA, unitB));
		when(roomStockRepository.findByRoomUnitIdAndStockDate(anyLong(), any(LocalDate.class))).thenReturn(Optional.empty());
		when(roomStockRepository.countAvailableByRoomIdAndStockDate(eq(10L), any(LocalDate.class))).thenReturn(Optional.of(2L));
		when(roomStockSummaryRepository.findByRoomIdAndStockDate(eq(10L), any(LocalDate.class))).thenReturn(Optional.empty());
		List<List<RoomStock>> savedStockBatches = new ArrayList<>();
		when(roomStockRepository.saveAll(any())).thenAnswer(invocation -> {
			List<RoomStock> stocks = new ArrayList<>();
			Iterable<RoomStock> iterable = invocation.getArgument(0);
			iterable.forEach(stocks::add);
			savedStockBatches.add(stocks);
			return stocks;
		});

		service.generateRoomStock(startDate, endDate);

		verify(roomStockRepository, org.mockito.Mockito.times(2)).saveAll(any());
		assertThat(savedStockBatches).allSatisfy(stocks -> assertThat(stocks).hasSize(2));
		assertThat(savedStockBatches.get(0))
				.extracting(RoomStock::getStockDate)
				.containsOnly(startDate);
		assertThat(savedStockBatches.get(1))
				.extracting(RoomStock::getStockDate)
				.containsOnly(endDate);

		ArgumentCaptor<RoomStockSummary> summaryCaptor = ArgumentCaptor.forClass(RoomStockSummary.class);
		verify(roomStockSummaryRepository, org.mockito.Mockito.times(2)).save(summaryCaptor.capture());
		assertThat(summaryCaptor.getAllValues())
				.extracting(RoomStockSummary::getTotalStock)
				.containsOnly(2);
		assertThat(summaryCaptor.getAllValues())
				.extracting(RoomStockSummary::getAvailableStock)
				.containsOnly(2);
	}

	@Test
	void generateRoomStockRejectsInvalidDateRange() {
		assertThatThrownBy(() -> service.generateRoomStock(LocalDate.of(2026, 6, 13), LocalDate.of(2026, 6, 12)))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessage("Invalid room stock date range");
	}

	@Test
	void allocateRoomStocksAssignsSameRoomUnitForWholeStay() throws InterruptedException {
		LocalDate checkIn = LocalDate.of(2026, 6, 12);
		LocalDate checkOut = checkIn.plusDays(2);
		Room room = room(10L);
		RoomUnit roomUnit = roomUnit(100L, room);
		ReservationDTO reservationDTO = reservationDTO(10L, checkIn, checkOut);
		Reservation reservation = new Reservation();
		RoomStock firstNight = roomStock(1000L, roomUnit, checkIn);
		RoomStock secondNight = roomStock(1001L, roomUnit, checkIn.plusDays(1));

		when(roomUnitRepository.findByRoomId(10L)).thenReturn(List.of(roomUnit));
		when(roomStockRepository.findByRoomUnitIdAndStockDateAndReservationIdIsNull(100L, checkIn))
				.thenReturn(Optional.of(firstNight));
		when(roomStockRepository.findByRoomUnitIdAndStockDateAndReservationIdIsNull(100L, checkIn.plusDays(1)))
				.thenReturn(Optional.of(secondNight));
		when(redissonClient.getLock(any(String.class))).thenReturn(lock);
		when(lock.tryLock(10, TimeUnit.SECONDS)).thenReturn(true);
		when(lock.isHeldByCurrentThread()).thenReturn(true);
		when(roomStockRepository.findById(1000L)).thenReturn(Optional.of(firstNight));
		when(roomStockRepository.findById(1001L)).thenReturn(Optional.of(secondNight));
		when(roomStockRepository.save(any(RoomStock.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(roomStockRepository.countAvailableByRoomIdAndStockDate(eq(10L), any(LocalDate.class))).thenReturn(Optional.of(0L));
		when(roomStockSummaryRepository.findByRoomIdAndStockDate(eq(10L), any(LocalDate.class))).thenReturn(Optional.empty());

		Map<LocalDate, RoomStock> allocation = service.allocateRoomStocks(reservationDTO, reservation);

		assertThat(allocation).containsEntry(checkIn, firstNight);
		assertThat(allocation).containsEntry(checkIn.plusDays(1), secondNight);
		assertThat(firstNight.getReservation()).isSameAs(reservation);
		assertThat(secondNight.getReservation()).isSameAs(reservation);
		verify(lock, org.mockito.Mockito.times(2)).unlock();
		verify(roomStockSummaryRepository, org.mockito.Mockito.times(2)).save(any(RoomStockSummary.class));
	}

	@Test
	void allocateRoomStocksRejectsInvalidReservationDateRange() {
		ReservationDTO reservationDTO = reservationDTO(10L, LocalDate.of(2026, 6, 12), LocalDate.of(2026, 6, 12));

		assertThatThrownBy(() -> service.allocateRoomStocks(reservationDTO, new Reservation()))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessage("Invalid reservation date range");
		verify(roomUnitRepository, never()).findByRoomId(anyLong());
	}

	@Test
	void allocateRoomStocksFailsWhenRoomHasNoUnits() {
		ReservationDTO reservationDTO = reservationDTO(10L, LocalDate.of(2026, 6, 12), LocalDate.of(2026, 6, 13));
		when(roomUnitRepository.findByRoomId(10L)).thenReturn(List.of());

		assertThatThrownBy(() -> service.allocateRoomStocks(reservationDTO, new Reservation()))
				.isInstanceOf(RuntimeException.class)
				.hasMessage("No room units exist for roomId: 10");
	}

	private Corporation corporation(Long corpUserId) {
		Corporation corporation = new Corporation();
		corporation.setCorpUserId(corpUserId);
		corporation.setCorpStatus(CorpStatus.REGISTERED);
		return corporation;
	}

	private Room room(Long roomId) {
		Room room = new Room();
		room.setRoomId(roomId);
		return room;
	}

	private RoomUnit roomUnit(Long roomUnitId, Room room) {
		RoomUnit roomUnit = new RoomUnit();
		roomUnit.setRoomUnitId(roomUnitId);
		roomUnit.setRoom(room);
		return roomUnit;
	}

	private RoomStock roomStock(Long roomStockId, RoomUnit roomUnit, LocalDate stockDate) {
		RoomStock roomStock = new RoomStock();
		roomStock.setRoomStockId(roomStockId);
		roomStock.setRoomUnit(roomUnit);
		roomStock.setStockDate(stockDate);
		return roomStock;
	}

	private ReservationDTO reservationDTO(Long roomId, LocalDate checkIn, LocalDate checkOut) {
		ReservationDTO reservationDTO = new ReservationDTO();
		reservationDTO.setRoomId(roomId);
		reservationDTO.setCheckIn(checkIn);
		reservationDTO.setCheckOut(checkOut);
		return reservationDTO;
	}
}
