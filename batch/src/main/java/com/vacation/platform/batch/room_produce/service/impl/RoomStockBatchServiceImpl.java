package com.vacation.platform.batch.room_produce.service.impl;

import com.vacation.platform.batch.room_produce.dto.RoomStockBatchResult;
import com.vacation.platform.batch.room_produce.service.BatchControlService;
import com.vacation.platform.batch.room_produce.service.RoomStockBatchService;
import com.vacation.platform.corp.corperation.service.RoomStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomStockBatchServiceImpl implements RoomStockBatchService {

	public static final String BATCH_NAME = "ROOM_STOCK_GENERATION";

	private final RoomStockService roomStockService;
	private final BatchControlService batchControlService;

	@Value("${batch.room-stock.days:90}")
	private int defaultGenerateDays;

	@Override
	public RoomStockBatchResult runScheduled() {
		if (!batchControlService.isAutoRunEnabled(BATCH_NAME)) {
			log.info("{} skipped because auto run is disabled", BATCH_NAME);
			LocalDate today = LocalDate.now();
			return new RoomStockBatchResult(BATCH_NAME, today, today, 0, false, "auto run disabled");
		}

		return execute(defaultGenerateDays, "scheduled run completed");
	}

	@Override
	public RoomStockBatchResult runManually(Integer days) {
		return execute(resolveDays(days), "manual run completed");
	}

	private RoomStockBatchResult execute(int days, String message) {
		LocalDate startDate = LocalDate.now();
		LocalDate endDate = startDate.plusDays(days - 1L);

		log.info("{} started. startDate={}, endDate={}, days={}", BATCH_NAME, startDate, endDate, days);
		roomStockService.generateRoomStock(startDate, endDate);
		batchControlService.updateLastRunTime(BATCH_NAME);
		log.info("{} finished. startDate={}, endDate={}, days={}", BATCH_NAME, startDate, endDate, days);

		return new RoomStockBatchResult(BATCH_NAME, startDate, endDate, days, true, message);
	}

	private int resolveDays(Integer days) {
		int resolvedDays = days == null ? defaultGenerateDays : days;
		if (resolvedDays <= 0) {
			throw new IllegalArgumentException("days must be greater than zero");
		}
		return resolvedDays;
	}
}
