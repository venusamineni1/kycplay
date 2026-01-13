INSERT INTO Clients (TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status) VALUES ('Mr.', 'Acme', 'The', 'Corp', '', 'USA', '', '2023-01-15', 'Active');
INSERT INTO Clients (TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status) VALUES ('Dr.', 'Globex', '', 'Inc', 'Esq.', 'UK', 'USA', '2023-03-22', 'Pending');
INSERT INTO Clients (TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status) VALUES ('', 'Soylent', 'Green', 'Corp', '', 'France', '', '2023-06-10', 'Inactive');
INSERT INTO Clients (TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status) VALUES ('Ms.', 'Umbrella', 'T', 'Corp', '', 'Canada', 'UK', '2023-11-05', 'Active');

INSERT INTO ClientAddresses (ClientID, AddressType, AddressLine1, AddressLine2, City, Zip, Country) VALUES (1, 'Postal', '123 Road Runner Way', '', 'Desert City', '85001', 'USA');
INSERT INTO ClientAddresses (ClientID, AddressType, AddressLine1, AddressLine2, City, Zip, Country) VALUES (2, 'Residential', '456 Cypress Creek', 'Suite 200', 'Springfield', '62704', 'USA');
INSERT INTO ClientAddresses (ClientID, AddressType, AddressLine1, AddressLine2, City, Zip, Country) VALUES (3, 'Postal', '789 People Place', '', 'New York', '10001', 'USA');
INSERT INTO ClientAddresses (ClientID, AddressType, AddressLine1, AddressLine2, City, Zip, Country) VALUES (4, 'Other', '666 Hive St', 'Underground', 'Raccoon City', '90210', 'USA');


INSERT INTO ClientIdentifiers (ClientID, IdentifierType, IdentifierValue, IssuingAuthority) VALUES (1, 'Passport', 'A12345678', 'USA Dept of State');
INSERT INTO ClientIdentifiers (ClientID, IdentifierType, IdentifierValue, IssuingAuthority) VALUES (1, 'Social Issuance Number', '999-00-1111', 'SSA');
INSERT INTO ClientIdentifiers (ClientID, IdentifierType, IdentifierValue, IssuingAuthority) VALUES (2, 'NID', 'NID-987654321', 'Springfield Gov');
INSERT INTO ClientIdentifiers (ClientID, IdentifierType, IdentifierValue, IssuingAuthority) VALUES (3, 'Other', 'CORP-ID-555', 'State Registry');
INSERT INTO ClientIdentifiers (ClientID, IdentifierType, IdentifierValue, IssuingAuthority) VALUES (3, 'Tax ID', 'TAX-789-012', 'French Revenue Service');
INSERT INTO ClientIdentifiers (ClientID, IdentifierType, IdentifierValue, IssuingAuthority) VALUES (4, 'Business Reg', 'BR-456-789', 'Canada Business Bureau');

-- Sample Related Parties
INSERT INTO RelatedParties (ClientID, RelationType, TitlePrefix, FirstName, MiddleName, LastName, TitleSuffix, Citizenship1, Citizenship2, OnboardingDate, Status) 
VALUES (1, 'Legal representative', 'Ms.', 'Jane', 'Marie', 'Doe', '', 'USA', '', '2023-01-16', 'Active');

INSERT INTO RelatedPartyAddresses (RelatedPartyID, AddressType, AddressLine1, AddressLine2, City, Zip, Country) 
VALUES (1, 'Residential', '789 Lawyer Ln', 'Apartment 4B', 'Legal City', '90210', 'USA');

INSERT INTO RelatedPartyIdentifiers (RelatedPartyID, IdentifierType, IdentifierValue, IssuingAuthority) 
VALUES (1, 'License', 'L-1234567', 'State Bar');

INSERT INTO AppUsers (Username, Password, Role, Enabled) VALUES ('user', '{noop}password', 'USER', true);
INSERT INTO AppUsers (Username, Password, Role, Enabled) VALUES ('admin', '{noop}admin', 'ADMIN', true);
