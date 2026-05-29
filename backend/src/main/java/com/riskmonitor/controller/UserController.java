package com.riskmonitor.controller;

import com.riskmonitor.entity.UserProfile;
import com.riskmonitor.repository.UserProfileRepository;
import com.riskmonitor.web.CurrentUserId;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// client registers its name/email so member lists show it instead of a raw id
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserProfileRepository userProfileRepository;

    public record ProfileReq(String displayName, String email) {
    }

    @PostMapping("/me")
    @Transactional
    public void registerMe(@RequestBody ProfileReq req, @CurrentUserId String userId) {
        if (req.displayName() == null || req.displayName().isBlank()) {
            return;
        }
        userProfileRepository.findById(userId).ifPresentOrElse(
                profile -> profile.update(req.displayName(), req.email()),
                () -> userProfileRepository.save(new UserProfile(userId, req.displayName(), req.email()))
        );
    }
}
