package com.venus.kyc.viewer;

import java.time.LocalDate;

public record Client(
        Long clientID,
        String titlePrefix,
        String firstName,
        String middleName,
        String lastName,
        String titleSuffix,
        String citizenship1,
        String citizenship2,
        LocalDate onboardingDate,
        String status,
        java.util.List<Address> addresses,
        java.util.List<Identifier> identifiers,
        java.util.List<RelatedParty> relatedParties) {
}
