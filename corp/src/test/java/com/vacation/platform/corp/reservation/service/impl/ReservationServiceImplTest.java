package com.vacation.platform.corp.reservation.service.impl;

import com.vacation.platform.api.common.StayFinderException;
import com.vacation.platform.api.payment.dto.PaymentHistoryDTO;
import com.vacation.platform.api.payment.entity.PaymentMethod;
import com.vacation.platform.api.payment.service.impl.PaymentServiceImpl;
import com.vacation.platform.api.user.entity.User;
import com.vacation.platform.api.user.repository.UserRepository;
import com.vacation.platform.api.util.JwtUtil;
import com.vacation.platform.corp.corperation.entity.room.Room;
import com.vacation.platform.corp.corperation.entity.room.RoomStock;
import com.vacation.platform.corp.corperation.entity.room.RoomUnit;
import com.vacation.platform.corp.corperation.service.RoomStockService;
import com.vacation.platform.corp.reservation.dto.ReservationDTO;
import com.vacation.platform.corp.reservation.entity.Reservation;
import com.vacation.platform.corp.reservation.entity.ReservationRequestHistory;
import com.vacation.platform.corp.reservation.entity.ReservationRoomStock;
import com.vacation.platform.corp.reservation.entity.ReservationStatus;
import com.vacation.platform.corp.reservation.repository.ReservationRepository;
import com.vacation.platform.corp.reservation.repository.ReservationRequestHistoryRepository;
import com.vacation.platform.corp.reservation.repository.ReservationRoomStockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

	@Mock
	private RoomStockService roomStockService;

	@Mock
	private JwtUtil jwtUtil;

	@Mock
	private UserRepository userRepository;

	@Mock
	private PaymentServiceImpl paymentService;

	@Mock
	private ReservationRepository reservationRepository;

	@Mock
	private ReservationRequestHistoryRepository reservationRequestHistoryRepository;

	@Mock
	private ReservationRoomStockRepository reservationRoomStockRepository;

	private ReservationServiceImpl service;

	@BeforeEach
	void setUp() {
		service = new ReservationServiceImpl(
				roomStockService,
				jwtUtil,
				userRepository,
				paymentService,
				reservationRepository,
				reservationRequestHistoryRepository,
				reservationRoomStockRepository
		);
	}

	@Test
	void createReservationPersistsReservationAllocationHistoryMappingsAndPaymentRequest() {
		String token = "Bearer access-token";
		LocalDate checkIn = LocalDate.of(2026, 6, 12);
		LocalDate checkOut = checkIn.plusDays(2);
		ReservationDTO reservationDTO = reservationDTO(10L, checkIn, checkOut);
		User user = user(7L, "user@example.com");
		Reservation savedReservation = new Reservation();
		savedReservation.setReservationId(55L);
		Room room = room(10L);
		RoomUnit roomUnit = roomUnit(100L, room);
		RoomStock firstNight = roomStock(1000L, roomUnit, checkIn);
		RoomStock secondNight = roomStock(1001L, roomUnit, checkIn.plusDays(1));
		Map<LocalDate, RoomStock> allocation = new LinkedHashMap<>();
		allocation.put(checkIn, firstNight);
		allocation.put(checkIn.plusDays(1), secondNight);

		when(jwtUtil.getUserEmail(token)).thenReturn("user@example.com");
		when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
		when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);
		when(roomStockService.allocateRoomStocks(reservationDTO, savedReservation)).thenReturn(allocation);

		service.createReservation(token, reservationDTO);

		ArgumentCaptor<Reservation> reservationCaptor = ArgumentCaptor.forClass(Reservation.class);
		verify(reservationRepository).save(reservationCaptor.capture());
		assertThat(reservationCaptor.getValue().getUser()).isSameAs(user);
		assertThat(reservationCaptor.getValue().getCheckInDate()).isEqualTo(checkIn);
		assertThat(reservationCaptor.getValue().getCheckOutDate()).isEqualTo(checkOut);
		assertThat(reservationCaptor.getValue().getStatus()).isEqualTo(ReservationStatus.PENDING.name());

		ArgumentCaptor<ReservationRequestHistory> historyCaptor = ArgumentCaptor.forClass(ReservationRequestHistory.class);
		verify(reservationRequestHistoryRepository).save(historyCaptor.capture());
		assertThat(historyCaptor.getValue().getUserId()).isEqualTo(7L);
		assertThat(historyCaptor.getValue().getRoomId()).isEqualTo(10L);
		assertThat(historyCaptor.getValue().getRoomUnitId()).isEqualTo(100L);
		assertThat(historyCaptor.getValue().getStatus()).isEqualTo("PENDING");

		ArgumentCaptor<ReservationRoomStock> mappingCaptor = ArgumentCaptor.forClass(ReservationRoomStock.class);
		verify(reservationRoomStockRepository, org.mockito.Mockito.times(2)).save(mappingCaptor.capture());
		assertThat(mappingCaptor.getAllValues())
				.extracting(ReservationRoomStock::getReservation)
				.containsOnly(savedReservation);
		assertThat(mappingCaptor.getAllValues())
				.extracting(ReservationRoomStock::getRoomStock)
				.containsExactly(firstNight, secondNight);

		ArgumentCaptor<PaymentHistoryDTO> paymentCaptor = ArgumentCaptor.forClass(PaymentHistoryDTO.class);
		verify(paymentService).requestPayment(paymentCaptor.capture());
		assertThat(paymentCaptor.getValue().getReservationId()).isEqualTo(55L);
		assertThat(paymentCaptor.getValue().getUserId()).isEqualTo(7L);
		assertThat(paymentCaptor.getValue().getAmount()).isEqualByComparingTo("200000");
		assertThat(paymentCaptor.getValue().getPaymentMethod()).isEqualTo(PaymentMethod.CARD);
	}

	@Test
	void createReservationRejectsStayLongerThanThirtyDays() {
		ReservationDTO reservationDTO = reservationDTO(
				10L,
				LocalDate.of(2026, 6, 12),
				LocalDate.of(2026, 7, 13)
		);

		assertThatThrownBy(() -> service.createReservation("token", reservationDTO))
				.isInstanceOf(StayFinderException.class);
		verify(userRepository, never()).findByEmail(any());
		verify(reservationRepository, never()).save(any());
	}

	@Test
	void createReservationFailsWhenUserDoesNotExist() {
		ReservationDTO reservationDTO = reservationDTO(
				10L,
				LocalDate.of(2026, 6, 12),
				LocalDate.of(2026, 6, 13)
		);
		when(jwtUtil.getUserEmail("token")).thenReturn("missing@example.com");
		when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service.createReservation("token", reservationDTO))
				.isInstanceOf(StayFinderException.class);
		verify(reservationRepository, never()).save(any());
	}

	private ReservationDTO reservationDTO(Long roomId, LocalDate checkIn, LocalDate checkOut) {
		ReservationDTO reservationDTO = new ReservationDTO();
		reservationDTO.setRoomId(roomId);
		reservationDTO.setCheckIn(checkIn);
		reservationDTO.setCheckOut(checkOut);
		reservationDTO.setAmount(new BigDecimal("200000"));
		reservationDTO.setPayMethod(PaymentMethod.CARD);
		return reservationDTO;
	}

	private User user(Long userId, String email) {
		User user = new User();
		user.setUserId(userId);
		user.setEmail(email);
		return user;
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
}
