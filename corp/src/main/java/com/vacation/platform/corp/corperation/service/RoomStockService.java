package com.vacation.platform.corp.corperation.service;

import com.vacation.platform.corp.corperation.entity.room.RoomStock;
import com.vacation.platform.corp.reservation.dto.ReservationDTO;
import com.vacation.platform.corp.reservation.entity.Reservation;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

@Service
public interface RoomStockService {
	void generateTodayRoomStock();
	Map<LocalDate, RoomStock> allocateRoomStocks(ReservationDTO reservationDTO, Reservation reservation);
}
