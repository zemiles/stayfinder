package com.vacation.platform.batch.room_produce.service.impl;

import com.vacation.platform.batch.room_produce.dto.RoomStockBatchResult;
import com.vacation.platform.batch.room_produce.service.BatchControlService;
import com.vacation.platform.corp.corperation.service.RoomStockService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomStockBatchServiceImplTest {

	@Mock
	private RoomStockService roomStockService;

	@Mock
	private BatchControlService batchControlService;

	private RoomStockBatchServiceImpl service;

	@BeforeEach
	void setUp() {
		service = new RoomStockBatchServiceImpl(roomStockService, batchControlService);
		ReflectionTestUtils.setField(service, "defaultGenerateDays", 3);
	}

	@Test
	void runScheduledSkipsWhenAutoRunDisabled() {
		when(batchControlService.isAutoRunEnabled(RoomStockBatchServiceImpl.BATCH_NAME)).thenReturn(false);

		RoomStockBatchResult result = service.runScheduled();

		assertThat(result.batchName()).isEqualTo(RoomStockBatchServiceImpl.BATCH_NAME);
		assertThat(result.days()).isZero();
		assertThat(result.executed()).isFalse();
		assertThat(result.message()).isEqualTo("auto run disabled");
		verify(roomStockService, never()).generateRoomStock(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
		verify(batchControlService, never()).updateLastRunTime(org.mockito.ArgumentMatchers.anyString());
	}

	@Test
	void runScheduledGeneratesDefaultDateRangeWhenAutoRunEnabled() {
		when(batchControlService.isAutoRunEnabled(RoomStockBatchServiceImpl.BATCH_NAME)).thenReturn(true);
		LocalDate today = LocalDate.now();

		RoomStockBatchResult result = service.runScheduled();

		assertThat(result.days()).isEqualTo(3);
		assertThat(result.executed()).isTrue();
		assertThat(result.startDate()).isEqualTo(today);
		assertThat(result.endDate()).isEqualTo(today.plusDays(2));
		verify(roomStockService).generateRoomStock(today, today.plusDays(2));
		verify(batchControlService).updateLastRunTime(RoomStockBatchServiceImpl.BATCH_NAME);
	}

	@Test
	void runManuallyUsesRequestedDays() {
		LocalDate today = LocalDate.now();

		RoomStockBatchResult result = service.runManually(5);

		assertThat(result.days()).isEqualTo(5);
		assertThat(result.message()).isEqualTo("manual run completed");
		verify(roomStockService).generateRoomStock(today, today.plusDays(4));
		verify(batchControlService).updateLastRunTime(RoomStockBatchServiceImpl.BATCH_NAME);
	}

	@Test
	void runManuallyRejectsNonPositiveDays() {
		assertThatThrownBy(() -> service.runManually(0))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessage("days must be greater than zero");
	}
}
