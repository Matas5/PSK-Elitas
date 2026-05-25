package com.riskmonitor.dto.auth;

import com.riskmonitor.entity.AppUser;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthStruct {

    private AuthStruct() {
    }

    public record LocalRegisterReq(
            @NotBlank @Size(min = 3, max = 64)
            String username,

            @NotBlank @Size(min = 8, max = 128)
            String password
    ) {}

    public record LocalLoginReq(
            @NotBlank @Size(min = 3, max = 64)
            String username,

            @NotBlank @Size(min = 8, max = 128)
            String password
    ) {}

    public record LocalLoginResp(
            UUID userId,
            String username
    ) {
        public static LocalLoginResp from(AppUser user) {
            return new LocalLoginResp(user.getId(), user.getUsername());
        }
    }
}
