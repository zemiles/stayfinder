package com.vacation.platform.batch.room_produce.dto;

import java.time.LocalDate;

public record RoomStockBatchResult(
		String batchName,
		LocalDate startDate,
		LocalDate endDate,
		int days,
		boolean executed,
		String message
) {
}
