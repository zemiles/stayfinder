package com.vacation.platform.batch.room_produce.job;

import com.vacation.platform.batch.room_produce.service.RoomStockBatchService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RoomStockJob implements Job {

	@Autowired
	private RoomStockBatchService roomStockBatchService;

	public RoomStockJob() {
	}

	@Override
	public void execute(JobExecutionContext jobExecutionContext) {
		log.info("RoomStockJob started at {}", System.currentTimeMillis());
		roomStockBatchService.runScheduled();
	}
}
