package com.vacation.platform.batch.room_produce.service.impl;

import com.vacation.platform.batch.room_produce.entity.BatchControl;
import com.vacation.platform.batch.room_produce.repository.BatchControlRepository;
import com.vacation.platform.batch.room_produce.service.BatchControlService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BatchControlServiceImpl implements BatchControlService {

	private final BatchControlRepository batchControlRepository;

	@Override
	public boolean isAutoRunEnabled(String batchName) {
		return getOrCreateBatchControl(batchName, true).isAuto();
	}

	@Override
	public void updateLastRunTime(String batchName) {
		BatchControl batchControl = getOrCreateBatchControl(batchName, true);
		batchControl.setLastRunTime(new java.sql.Timestamp(System.currentTimeMillis()));
		batchControlRepository.save(batchControl);
	}

	@Override
	public void updateAutoRunSetting(String batchName, boolean isAuto) {
		BatchControl batchControl = getOrCreateBatchControl(batchName, isAuto);
		batchControl.setAuto(isAuto);
		batchControlRepository.save(batchControl);
	}

	private BatchControl getOrCreateBatchControl(String batchName, boolean defaultAuto) {
		return batchControlRepository.findByBatchName(batchName)
				.orElseGet(() -> {
					BatchControl batchControl = new BatchControl();
					batchControl.setBatchName(batchName);
					batchControl.setAuto(defaultAuto);
					return batchControlRepository.save(batchControl);
				});
	}
}
