package com.venus.kyc.viewer;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .authorizeHttpRequests((authorize) -> authorize
                                                .requestMatchers("/login.html", "/style.css").permitAll()
                                                .requestMatchers("/api/users/me").authenticated()
                                                .requestMatchers("/users.html", "/api/users/**")
                                                .hasAuthority("MANAGE_USERS")
                                                .requestMatchers("/clients.html", "/details.html", "/api/clients/**")
                                                .hasAuthority("VIEW_CLIENTS")
                                                .requestMatchers("/changes.html", "/api/clients/changes")
                                                .hasAuthority("VIEW_CHANGES")
                                                .requestMatchers("/permissions.html", "/api/permissions/**")
                                                .hasAuthority("MANAGE_PERMISSIONS")
                                                .requestMatchers("/cases.html", "/case-details.html", "/api/cases/**")
                                                .hasAuthority("MANAGE_CASES")
                                                .anyRequest().authenticated())
                                .formLogin(form -> form
                                                .loginPage("/login.html")
                                                .loginProcessingUrl("/login")
                                                .defaultSuccessUrl("/index.html", true)
                                                .failureUrl("/login.html?error=true")
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessUrl("/login.html?logout=true")
                                                .permitAll())
                                .httpBasic(withDefaults())
                                .csrf(csrf -> csrf.disable()); // Disable CSRF for simplicity in this demo

                return http.build();
        }

        @Bean
        public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
                return org.springframework.security.crypto.factory.PasswordEncoderFactories
                                .createDelegatingPasswordEncoder();
        }
}
