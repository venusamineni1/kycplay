package com.venus.kyc.viewer;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ClientRepository {

        private final JdbcClient jdbcClient;

        public ClientRepository(JdbcClient jdbcClient) {
                this.jdbcClient = jdbcClient;
        }

        public List<Client> findAll() {
                List<Client> clients = jdbcClient.sql(
                                "SELECT ClientID, TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status FROM Clients")
                                .query((rs, rowNum) -> new Client(
                                                rs.getLong("ClientID"),
                                                rs.getString("TitlePrefix"),
                                                rs.getString("FirstName"),
                                                rs.getString("MiddleName"),
                                                rs.getString("LastName"),
                                                rs.getString("TitleSuffix"),
                                                rs.getString("Citizenship1"),
                                                rs.getString("Citizenship2"),
                                                rs.getDate("OnboardingDate").toLocalDate(),
                                                rs.getString("Status"),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>()))
                                .list();

                for (Client client : clients) {
                        client.addresses().addAll(fetchAddresses(client.clientID()));
                        client.identifiers().addAll(fetchIdentifiers(client.clientID()));
                        client.relatedParties().addAll(fetchRelatedParties(client.clientID()));
                }

                return clients;
        }

        public Optional<Client> findById(Long id) {
                Optional<Client> clientOpt = jdbcClient.sql(
                                "SELECT ClientID, TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status FROM Clients WHERE ClientID = :id")
                                .param("id", id)
                                .query((rs, rowNum) -> new Client(
                                                rs.getLong("ClientID"),
                                                rs.getString("TitlePrefix"),
                                                rs.getString("FirstName"),
                                                rs.getString("MiddleName"),
                                                rs.getString("LastName"),
                                                rs.getString("TitleSuffix"),
                                                rs.getString("Citizenship1"),
                                                rs.getString("Citizenship2"),
                                                rs.getDate("OnboardingDate").toLocalDate(),
                                                rs.getString("Status"),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>()))
                                .optional();

                if (clientOpt.isPresent()) {
                        Client client = clientOpt.get();
                        client.addresses().addAll(fetchAddresses(id));
                        client.identifiers().addAll(fetchIdentifiers(id));
                        client.relatedParties().addAll(fetchRelatedParties(id));
                }

                return clientOpt;
        }

        private List<Address> fetchAddresses(Long id) {
                return jdbcClient.sql(
                                "SELECT AddressID, AddressType, AddressLine1, AddressLine2, City, Zip, Country FROM ClientAddresses WHERE ClientID = :id")
                                .param("id", id)
                                .query(Address.class)
                                .list();
        }

        private List<Identifier> fetchIdentifiers(Long id) {
                return jdbcClient.sql(
                                "SELECT IdentifierID, IdentifierType, IdentifierValue, IssuingAuthority FROM ClientIdentifiers WHERE ClientID = :id")
                                .param("id", id)
                                .query(Identifier.class)
                                .list();
        }

        private List<RelatedParty> fetchRelatedParties(Long clientID) {
                List<RelatedParty> parties = jdbcClient.sql(
                                "SELECT RelatedPartyID, ClientID, RelationType, TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status FROM RelatedParties WHERE ClientID = :id")
                                .param("id", clientID)
                                .query((rs, rowNum) -> new RelatedParty(
                                                rs.getLong("RelatedPartyID"),
                                                rs.getLong("ClientID"),
                                                rs.getString("RelationType"),
                                                rs.getString("TitlePrefix"),
                                                rs.getString("FirstName"),
                                                rs.getString("MiddleName"),
                                                rs.getString("LastName"),
                                                rs.getString("TitleSuffix"),
                                                rs.getString("Citizenship1"),
                                                rs.getString("Citizenship2"),
                                                rs.getDate("OnboardingDate") != null
                                                                ? rs.getDate("OnboardingDate").toLocalDate()
                                                                : null,
                                                rs.getString("Status"),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>()))
                                .list();

                for (RelatedParty party : parties) {
                        party.addresses().addAll(jdbcClient.sql(
                                        "SELECT AddressID, AddressType, AddressLine1, AddressLine2, City, Zip, Country FROM RelatedPartyAddresses WHERE RelatedPartyID = :id")
                                        .param("id", party.relatedPartyID())
                                        .query(Address.class)
                                        .list());
                        party.identifiers().addAll(jdbcClient.sql(
                                        "SELECT IdentifierID, IdentifierType, IdentifierValue, IssuingAuthority FROM RelatedPartyIdentifiers WHERE RelatedPartyID = :id")
                                        .param("id", party.relatedPartyID())
                                        .query(Identifier.class)
                                        .list());
                }
                return parties;
        }

        public void saveRelatedParty(Long clientID, RelatedParty rp) {
                jdbcClient.sql(
                                "INSERT INTO RelatedParties (ClientID, RelationType, TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status) VALUES (:clientID, :relationType, :titlePrefix, :firstName, :middleName, :lastName, :titleSuffix, :citizenship1, :citizenship2, :onboardingDate, :status)")
                                .param("clientID", clientID)
                                .param("relationType", rp.relationType())
                                .param("titlePrefix", rp.titlePrefix())
                                .param("firstName", rp.firstName())
                                .param("middleName", rp.middleName())
                                .param("lastName", rp.lastName())
                                .param("titleSuffix", rp.titleSuffix())
                                .param("citizenship1", rp.citizenship1())
                                .param("citizenship2", rp.citizenship2())
                                .param("onboardingDate", rp.onboardingDate())
                                .param("status", rp.status())
                                .update();
        }

        public Optional<RelatedParty> findRelatedPartyById(Long id) {
                Optional<RelatedParty> partyOpt = jdbcClient.sql(
                                "SELECT RelatedPartyID, ClientID, RelationType, TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status FROM RelatedParties WHERE RelatedPartyID = :id")
                                .param("id", id)
                                .query((rs, rowNum) -> new RelatedParty(
                                                rs.getLong("RelatedPartyID"),
                                                rs.getLong("ClientID"),
                                                rs.getString("RelationType"),
                                                rs.getString("TitlePrefix"),
                                                rs.getString("FirstName"),
                                                rs.getString("MiddleName"),
                                                rs.getString("LastName"),
                                                rs.getString("TitleSuffix"),
                                                rs.getString("Citizenship1"),
                                                rs.getString("Citizenship2"),
                                                rs.getDate("OnboardingDate") != null
                                                                ? rs.getDate("OnboardingDate").toLocalDate()
                                                                : null,
                                                rs.getString("Status"),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>()))
                                .optional();

                if (partyOpt.isPresent()) {
                        RelatedParty party = partyOpt.get();
                        party.addresses().addAll(jdbcClient.sql(
                                        "SELECT AddressID, AddressType, AddressLine1, AddressLine2, City, Zip, Country FROM RelatedPartyAddresses WHERE RelatedPartyID = :id")
                                        .param("id", id)
                                        .query(Address.class)
                                        .list());
                        party.identifiers().addAll(jdbcClient.sql(
                                        "SELECT IdentifierID, IdentifierType, IdentifierValue, IssuingAuthority FROM RelatedPartyIdentifiers WHERE RelatedPartyID = :id")
                                        .param("id", id)
                                        .query(Identifier.class)
                                        .list());
                }
                return partyOpt;
        }

        public List<Client> searchByName(String query) {
                String likeQuery = "%" + query + "%";
                List<Client> clients = jdbcClient.sql(
                                "SELECT ClientID, TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status FROM Clients WHERE FirstName LIKE :query OR MiddleName LIKE :query OR LastName LIKE :query")
                                .param("query", likeQuery)
                                .query((rs, rowNum) -> new Client(
                                                rs.getLong("ClientID"),
                                                rs.getString("TitlePrefix"),
                                                rs.getString("FirstName"),
                                                rs.getString("MiddleName"),
                                                rs.getString("LastName"),
                                                rs.getString("TitleSuffix"),
                                                rs.getString("Citizenship1"),
                                                rs.getString("Citizenship2"),
                                                rs.getDate("OnboardingDate").toLocalDate(),
                                                rs.getString("Status"),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>(),
                                                new java.util.ArrayList<>()))
                                .list();

                for (Client client : clients) {
                        client.addresses().addAll(fetchAddresses(client.clientID()));
                        client.identifiers().addAll(fetchIdentifiers(client.clientID()));
                        client.relatedParties().addAll(fetchRelatedParties(client.clientID()));
                }

                return clients;
        }
}
