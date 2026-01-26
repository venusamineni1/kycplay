package com.venus.kyc.viewer;

import org.springframework.http.HttpStatus;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .authorizeHttpRequests((authorize) -> authorize
                                                .requestMatchers("/", "/index.html", "/login.html", "/login",
                                                                "/style.css",
                                                                "/assets/**",
                                                                "/*.js", "/*.css", "/*.ico", "/*.png", "/*.jpg",
                                                                "/api/risk/**")
                                                .permitAll()
                                                .requestMatchers("/api/users/me").authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users")
                                                .authenticated() // Allow listing users
                                                .requestMatchers("/api/users/**").hasAuthority("MANAGE_USERS")
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/clients")
                                                .authenticated() // Allow listing clients
                                                .requestMatchers("/api/clients/**").hasAuthority("VIEW_CLIENTS")
                                                .requestMatchers("/api/clients/changes").hasAuthority("VIEW_CHANGES")
                                                .requestMatchers("/api/permissions/**")
                                                .hasAuthority("MANAGE_PERMISSIONS")
                                                .requestMatchers("/api/cases/**").hasAuthority("MANAGE_CASES")
                                                .anyRequest().authenticated())
                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .loginProcessingUrl("/api/login")
                                                .successHandler((request, response, authentication) -> {
                                                        response.setStatus(200);
                                                })
                                                .failureHandler((request, response, exception) -> {
                                                        response.setStatus(401);
                                                })
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/api/logout")
                                                .logoutSuccessHandler((request, response, authentication) -> {
                                                        response.setStatus(200);
                                                })
                                                .invalidateHttpSession(true)
                                                .deleteCookies("JSESSIONID")
                                                .permitAll())
                                .exceptionHandling(e -> e
                                                .authenticationEntryPoint(
                                                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                                .csrf(csrf -> csrf.disable()); // Disable CSRF for simplicity in this demo

                return http.build();
        }

        @Bean
        public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
                return org.springframework.security.crypto.factory.PasswordEncoderFactories
                                .createDelegatingPasswordEncoder();
        }
}
