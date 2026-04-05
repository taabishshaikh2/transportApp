package com.company.transport_app.service;

import com.company.transport_app.model.Users;
import com.company.transport_app.repository.UsersRepository;
import com.company.transport_app.request.LoginRequest;
import com.company.transport_app.request.RegisterRequest;
import com.company.transport_app.response.LoginResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        if (request == null) return null;
        else if (request.userName() == null || request.password() == null) return null;

        authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(request.userName(), request.password()));

        UserDetails user = usersRepository.findByUserName(request.userName()).orElseThrow();

        String token = jwtUtils.generateToken(user);
        return new LoginResponse(token);
    }

    @Override
    public LoginResponse register(RegisterRequest request) {
        if (request == null) return null;
        else if (request.userName() == null || request.password() == null) return null;

        if (usersRepository.existsByUserNameAndIsActive(request.userName(), true)) {
            log.error("UserName Already Exist");
            return null;
        }

        Users users = Users
                .builder()
                .fullName(request.fullName())
                .password(passwordEncoder.encode(request.password()))
                .createdAt(new Date())
                .email(request.email())
                .userName(request.userName())
                .build();

        usersRepository.save(users);

        String token = jwtUtils.generateToken(users);
        return new LoginResponse(token);
    }
}
