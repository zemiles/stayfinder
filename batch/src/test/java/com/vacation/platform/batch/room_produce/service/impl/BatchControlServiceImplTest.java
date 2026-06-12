package com.vacation.platform.batch.room_produce.service.impl;

import com.vacation.platform.batch.room_produce.entity.BatchControl;
import com.vacation.platform.batch.room_produce.repository.BatchControlRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchControlServiceImplTest {

	@Mock
	private BatchControlRepository batchControlRepository;

	@Test
	void isAutoRunEnabledCreatesEnabledControlWhenMissing() {
		when(batchControlRepository.findByBatchName("ROOM_STOCK_GENERATION")).thenReturn(Optional.empty());
		when(batchControlRepository.save(any(BatchControl.class))).thenAnswer(invocation -> invocation.getArgument(0));
		BatchControlServiceImpl service = new BatchControlServiceImpl(batchControlRepository);

		boolean enabled = service.isAutoRunEnabled("ROOM_STOCK_GENERATION");

		assertThat(enabled).isTrue();
		ArgumentCaptor<BatchControl> captor = ArgumentCaptor.forClass(BatchControl.class);
		verify(batchControlRepository).save(captor.capture());
		assertThat(captor.getValue().getBatchName()).isEqualTo("ROOM_STOCK_GENERATION");
		assertThat(captor.getValue().isAuto()).isTrue();
	}

	@Test
	void updateAutoRunSettingUpdatesExistingControl() {
		BatchControl batchControl = new BatchControl();
		batchControl.setBatchName("ROOM_STOCK_GENERATION");
		batchControl.setAuto(true);
		when(batchControlRepository.findByBatchName("ROOM_STOCK_GENERATION")).thenReturn(Optional.of(batchControl));
		BatchControlServiceImpl service = new BatchControlServiceImpl(batchControlRepository);

		service.updateAutoRunSetting("ROOM_STOCK_GENERATION", false);

		assertThat(batchControl.isAuto()).isFalse();
		verify(batchControlRepository).save(batchControl);
	}

	@Test
	void updateLastRunTimeCreatesControlAndSetsTimestampWhenMissing() {
		when(batchControlRepository.findByBatchName("ROOM_STOCK_GENERATION")).thenReturn(Optional.empty());
		when(batchControlRepository.save(any(BatchControl.class))).thenAnswer(invocation -> invocation.getArgument(0));
		BatchControlServiceImpl service = new BatchControlServiceImpl(batchControlRepository);

		service.updateLastRunTime("ROOM_STOCK_GENERATION");

		ArgumentCaptor<BatchControl> captor = ArgumentCaptor.forClass(BatchControl.class);
		verify(batchControlRepository, org.mockito.Mockito.times(2)).save(captor.capture());
		BatchControl updatedControl = captor.getAllValues().get(1);
		assertThat(updatedControl.getBatchName()).isEqualTo("ROOM_STOCK_GENERATION");
		assertThat(updatedControl.isAuto()).isTrue();
		assertThat(updatedControl.getLastRunTime()).isNotNull();
	}
}
