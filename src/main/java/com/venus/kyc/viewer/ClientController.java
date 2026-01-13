package com.venus.kyc.viewer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientRepository clientRepository;

    public ClientController(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @GetMapping
    public List<Client> getAllClients(org.springframework.security.core.Authentication authentication) {
        List<Client> clients = clientRepository.findAll();
        if (isAdmin(authentication)) {
            return clients;
        }
        return clients.stream().map(this::maskSensitiveData).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> getClientById(@PathVariable Long id,
            org.springframework.security.core.Authentication authentication) {
        return clientRepository.findById(id)
                .map(client -> isAdmin(authentication) ? client : maskSensitiveData(client))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/related-parties")
    public ResponseEntity<Void> addRelatedParty(@PathVariable Long id, @RequestBody RelatedParty rp) {
        clientRepository.saveRelatedParty(id, rp);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/related-parties/{id}")
    public ResponseEntity<RelatedParty> getRelatedPartyById(@PathVariable Long id,
            org.springframework.security.core.Authentication authentication) {
        return clientRepository.findRelatedPartyById(id)
                .map(party -> isAdmin(authentication) ? party : maskRelatedPartySensitiveData(party))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Client> searchClients(@org.springframework.web.bind.annotation.RequestParam String query,
            org.springframework.security.core.Authentication authentication) {
        List<Client> clients = clientRepository.searchByName(query);
        if (isAdmin(authentication)) {
            return clients;
        }
        return clients.stream().map(this::maskSensitiveData).toList();
    }

    private boolean isAdmin(org.springframework.security.core.Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private Client maskSensitiveData(Client client) {
        // Return a new Client record with null addresses, identifiers, and related
        // parties
        return new Client(
                client.clientID(),
                client.titlePrefix(),
                client.firstName(),
                client.middleName(),
                client.lastName(),
                client.titleSuffix(),
                client.citizenship1(),
                client.citizenship2(),
                client.onboardingDate(),
                client.status(),
                null, // Masked addresses
                null, // Masked identifiers
                null // Masked related parties
        );
    }

    private RelatedParty maskRelatedPartySensitiveData(RelatedParty party) {
        return new RelatedParty(
                party.relatedPartyID(),
                party.clientID(),
                party.relationType(),
                party.titlePrefix(),
                party.firstName(),
                party.middleName(),
                party.lastName(),
                party.titleSuffix(),
                party.citizenship1(),
                party.citizenship2(),
                party.onboardingDate(),
                party.status(),
                null, // Masked addresses
                null // Masked identifiers
        );
    }
}
