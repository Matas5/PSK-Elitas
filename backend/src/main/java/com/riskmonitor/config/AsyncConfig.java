package com.riskmonitor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.security.task.DelegatingSecurityContextAsyncTaskExecutor;

/*
   New-thread pattern task-N
*/
@Configuration
public class AsyncConfig {

    @Bean
    public AsyncTaskExecutor taskExecutor() {
        return new DelegatingSecurityContextAsyncTaskExecutor(new SimpleAsyncTaskExecutor("task-"));
    }
}
