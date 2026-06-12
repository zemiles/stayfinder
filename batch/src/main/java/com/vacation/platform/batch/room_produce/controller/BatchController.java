package com.vacation.platform.batch.room_produce.controller;

import com.vacation.platform.api.common.ErrorType;
import com.vacation.platform.api.common.StayFinderException;
import com.vacation.platform.api.util.StayFinderResponseDTO;
import com.vacation.platform.batch.room_produce.dto.BatchDTO;
import com.vacation.platform.batch.room_produce.dto.RoomStockBatchResult;
import com.vacation.platform.batch.room_produce.service.RoomStockBatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/batch")
@RequiredArgsConstructor
public class BatchController {

	private final RoomStockBatchService roomStockBatchService;

	@PostMapping("/room/produce")
	public StayFinderResponseDTO<?> roomProduceBatch(@RequestBody(required = false) BatchDTO batchDTO) {
		return generateRoomStock(batchDTO);
	}

	@PostMapping("/room-stock/generate")
	public StayFinderResponseDTO<?> generateRoomStock(@RequestBody(required = false) BatchDTO batchDTO) {
		try {
			Integer days = batchDTO == null ? null : batchDTO.getDays();
			RoomStockBatchResult result = roomStockBatchService.runManually(days);
			return StayFinderResponseDTO.success(result);
		} catch (Exception e) {
			throw new StayFinderException(ErrorType.SYSTEM_ERROR, Map.of(), log::error, e);
		}
	}
}
