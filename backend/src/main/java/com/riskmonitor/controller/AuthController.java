package com.riskmonitor.controller;

import com.riskmonitor.dto.auth.AuthStruct.LocalLoginReq;
import com.riskmonitor.dto.auth.AuthStruct.LocalLoginResp;
import com.riskmonitor.dto.auth.AuthStruct.LocalRegisterReq;
import com.riskmonitor.service.auth.LocalAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/local")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final LocalAuthService localAuthService;

    @PostMapping("/register")
    public ResponseEntity<LocalLoginResp> register(@Valid @RequestBody LocalRegisterReq req) {
        var resp = localAuthService.register(req);
        log.info("Registered local user {} ({})", resp.username(), resp.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PostMapping("/login")
    public LocalLoginResp login(@Valid @RequestBody LocalLoginReq req) {
        var resp = localAuthService.login(req);
        log.info("Local login: {} ({})", resp.username(), resp.userId());
        return resp;
    }
}
