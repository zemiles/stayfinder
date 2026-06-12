package com.vacation.platform.batch.room_produce.service;

import com.vacation.platform.batch.room_produce.dto.RoomStockBatchResult;

public interface RoomStockBatchService {
	RoomStockBatchResult runScheduled();
	RoomStockBatchResult runManually(Integer days);
}
