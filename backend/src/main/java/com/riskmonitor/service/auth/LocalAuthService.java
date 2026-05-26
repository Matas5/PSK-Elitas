package com.riskmonitor.service.auth;

import com.riskmonitor.dto.auth.AuthStruct.LocalLoginReq;
import com.riskmonitor.dto.auth.AuthStruct.LocalLoginResp;
import com.riskmonitor.dto.auth.AuthStruct.LocalRegisterReq;
import com.riskmonitor.entity.AppUser;
import com.riskmonitor.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocalAuthService {

    private static final String INVALID_CREDENTIALS_MESSAGE =
            "Invalid username or password. Create an account first if you do not have one.";

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public LocalLoginResp register(LocalRegisterReq req) {
        String username = req.username().trim();
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken: " + username);
        }
        AppUser user = new AppUser(username, passwordEncoder.encode(req.password()));
        return LocalLoginResp.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public LocalLoginResp login(LocalLoginReq req) {
        AppUser user = userRepository.findByUsername(req.username().trim())
                .orElseThrow(() -> new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE);
        }
        return LocalLoginResp.from(user);
    }
}
