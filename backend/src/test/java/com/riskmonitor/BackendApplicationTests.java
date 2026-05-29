package com.riskmonitor;

import com.riskmonitor.repository.AppUserRepository;
import com.riskmonitor.repository.RiskRepository;
import com.riskmonitor.repository.RiskValueRepository;
import com.riskmonitor.repository.TeamMemberRepository;
import com.riskmonitor.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Optional;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
                + "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration,"
                + "org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration",
        "riskmonitor.seed.enabled=false"
})
@Import(BackendApplicationTests.RepositoryTestConfig.class)
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }

    @TestConfiguration
    static class RepositoryTestConfig {

        @Bean
        AppUserRepository appUserRepository() {
            return repositoryProxy(AppUserRepository.class);
        }

        @Bean
        RiskRepository riskRepository() {
            return repositoryProxy(RiskRepository.class);
        }

        @Bean
        RiskValueRepository riskValueRepository() {
            return repositoryProxy(RiskValueRepository.class);
        }

        @Bean
        TeamRepository teamRepository() {
            return repositoryProxy(TeamRepository.class);
        }

        @Bean
        TeamMemberRepository teamMemberRepository() {
            return repositoryProxy(TeamMemberRepository.class);
        }

        @SuppressWarnings("unchecked")
        private static <T> T repositoryProxy(Class<T> repositoryType) {
            return (T) Proxy.newProxyInstance(
                    repositoryType.getClassLoader(),
                    new Class<?>[]{repositoryType},
                    (proxy, method, args) -> {
                        Class<?> returnType = method.getReturnType();
                        if (Optional.class.equals(returnType)) {
                            return Optional.empty();
                        }
                        if (List.class.equals(returnType)) {
                            return List.of();
                        }
                        if (boolean.class.equals(returnType)) {
                            return false;
                        }
                        if (long.class.equals(returnType)) {
                            return 0L;
                        }
                        if (int.class.equals(returnType)) {
                            return 0;
                        }
                        return null;
                    }
            );
        }
    }
}
