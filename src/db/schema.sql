
   1./*
   USERS TABLE*/

CREATE TABLE Users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    contact_phone NVARCHAR(20),
    address NVARCHAR(255),
    role NVARCHAR(10) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);


select*from Users
SELECT * FROM bookings WHERE user_id = 45;
UPDATE bookings
SET booking_status = 'Active', total_amount = 150
WHERE booking_id = 101 AND user_id = 45;

INSERT INTO bookings 
(user_id, vehicle_id, booking_date, return_date, total_amount, booking_status, created_at, updated_at)
VALUES 
(45, 3, '2025-11-28', '2025-12-05', 150, 'Active', GETDATE(), GETDATE());


UPDATE Users 
SET role = 'admin', updated_at = GETDATE()
WHERE user_id = 42;

   2./*
   VEHICLE SPECIFICATIONS TABLE*/
 
CREATE TABLE VehicleSpecifications (
    vehicle_spec_id INT PRIMARY KEY IDENTITY(1,1),
    manufacturer NVARCHAR(100) NOT NULL,
    model NVARCHAR(100) NOT NULL,
    year INT NOT NULL,
    fuel_type NVARCHAR(50),
    engine_capacity NVARCHAR(50),
    transmission NVARCHAR(50),
    seating_capacity INT,
    color NVARCHAR(50),
    features NVARCHAR(MAX)
);
ALTER TABLE VehicleSpecifications
DROP COLUMN image_url;

UPDATE VehicleSpecifications
SET 
  image1 = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
  image2 = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
  image3 = 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b'
WHERE manufacturer = 'Honda' AND model = 'Civic';


select*from VehicleSpecifications

ALTER TABLE VehicleSpecifications
ADD image1 VARCHAR(255),
    image2 VARCHAR(255),
    image3 VARCHAR(255);

/*
   3. VEHICLES TABLE */
CREATE TABLE Vehicles (
    vehicle_id INT PRIMARY KEY IDENTITY(1,1),
    vehicle_spec_id INT NOT NULL,
    rental_rate DECIMAL(10,2) NOT NULL,
    availability NVARCHAR(20)
        CHECK (availability IN ('Available', 'Unavailable'))
        DEFAULT 'Available',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT FK_Vehicle_Spec
        FOREIGN KEY (vehicle_spec_id)
        REFERENCES VehicleSpecifications(vehicle_spec_id)
        ON DELETE CASCADE
);
select*from Vehicles


UPDATE vehicles
SET rental_rate = 1
WHERE vehicle_id = 1;


/* 
   4. BOOKINGS TABLE
   */
CREATE TABLE Bookings (
    booking_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    booking_date DATE NOT NULL,
    return_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status NVARCHAR(20)
        CHECK (booking_status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed'))
        DEFAULT 'Pending',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT FK_Booking_User
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,

    CONSTRAINT FK_Booking_Vehicle
        FOREIGN KEY (vehicle_id) REFERENCES Vehicles(vehicle_id) ON DELETE CASCADE
);


SELECT* FROM Bookings
/* 
   5. PAYMENTS TABLE
   */
CREATE TABLE Payments (
    payment_id INT PRIMARY KEY IDENTITY(1,1),
    booking_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status NVARCHAR(20)
        CHECK (payment_status IN ('Pending', 'Paid', 'Failed'))
        DEFAULT 'Pending',
    payment_date DATETIME2 DEFAULT GETDATE(),
    payment_method NVARCHAR(50),
    transaction_id NVARCHAR(150),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT FK_Payment_Booking
        FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
        ON DELETE CASCADE
);
select*from Payments


/* 
   6. CUSTOMER SUPPORT TICKETS TABLE
   */
CREATE TABLE SupportTickets (
    ticket_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20)
        CHECK (status IN ('Open', 'In Progress', 'Closed'))
        DEFAULT 'Open',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),

    CONSTRAINT FK_Ticket_User
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);

select *from SupportTickets




-- Create TicketReplies table
CREATE TABLE TicketReplies (
    reply_id INT PRIMARY KEY IDENTITY(1,1),
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_admin BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (ticket_id) REFERENCES SupportTickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

Select *from TicketReplies
-- Add indexes for better performance
CREATE INDEX idx_ticket_replies_ticket_id ON TicketReplies(ticket_id);
CREATE INDEX idx_ticket_replies_created_at ON TicketReplies(created_at);




/*
   SAMPLE INSERT DATA FOR CAR RENTAL DATABASE 
   */


-- 1. INSERT USERS
INSERT INTO Users (first_name, last_name, email, password, contact_phone, address, role)
VALUES
('John', 'koech', 'john.koech@example.com', 'hashedpassword123', '555-1111', '123 Main St', 'user'),
('Sarah', 'Williams', 'sarah.w@example.com', 'hashedpassword456', '555-2222', '45 Oak Road', 'user'),
('Admin', 'User', 'admin@example.com', 'adminpass', '555-0000', 'HQ Office', 'admin');


-- 2. INSERT VEHICLE SPECIFICATIONS

INSERT INTO VehicleSpecifications 
(manufacturer, model, year, fuel_type, engine_capacity, transmission, seating_capacity, color, features)
VALUES
('Toyota', 'Corolla', 2022, 'Petrol', '1.8L', 'Automatic', 5, 'White', 'Bluetooth, ABS, Airbags'),
('Honda', 'Civic', 2021, 'Petrol', '2.0L', 'Manual', 5, 'Black', 'Cruise Control, Sunroof'),
('Ford', 'Explorer', 2023, 'Diesel', '3.0L', 'Automatic', 7, 'Blue', '4x4, Navigation System');

UPDATE VehicleSpecifications 
SET 
  image1 = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
  image2 = 'https://images.unsplash.com/photo-1511390164936-34f7e121f1ec',
  image3 = 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023'
WHERE vehicle_spec_id = 1;

UPDATE VehicleSpecifications 
SET 
  image1 = 'https://images.unsplash.com/photo-1493238792000-8113da705763',
  image2 = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
  image3 = 'https://images.unsplash.com/photo-1563720223185-11003e1f5f57'
WHERE vehicle_spec_id = 2;

UPDATE VehicleSpecifications 
SET 
  image1 = 'https://images.unsplash.com/photo-1600687982625-4b95c2e1b6a5',
  image2 = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be',
  image3 = 'https://images.unsplash.com/photo-1583267742291-137f7e8d94b6'
WHERE vehicle_spec_id = 3;

DELETE FROM vehicles WHERE created_at > '2025-11-19 12:00:00';

-- 3. INSERT VEHICLES
INSERT INTO Vehicles (vehicle_spec_id, rental_rate, availability, image_url)
VALUES
(1, 45.00, 'Available', 'https://example.com/images/corolla.jpg'),
(2, 55.00, 'Available', 'https://example.com/images/civic.jpg'),
(3, 85.00, 'Unavailable', 'https://example.com/images/explorer.jpg');




-- 4. INSERT BOOKINGS (UPDATED  NO LOCATION ID)

INSERT INTO Bookings 
(user_id, vehicle_id, booking_date, return_date, total_amount, booking_status)
VALUES
(1, 1, '2025-01-05', '2025-01-10', 225.00, 'Confirmed'),
(2, 2, '2025-02-01', '2025-02-03', 110.00, 'Pending'),
(1, 3, '2025-03-12', '2025-03-15', 255.00, 'Cancelled');


-- 5. INSERT PAYMENTS

INSERT INTO Payments 
(booking_id, amount, payment_status, payment_method, transaction_id)
VALUES
(1, 225.00, 'Paid', 'Credit Card', 'TXN12345'),
(2, 110.00, 'Pending', 'Debit Card', NULL),
(3, 255.00, 'Failed', 'PayPal', 'TXNFAIL999');


-- 6. INSERT SUPPORT TICKETS

INSERT INTO SupportTickets (user_id, subject, description, status)
VALUES
(1, 'Late Fee Inquiry', 'I was charged a late fee by mistake.', 'Open'),
(2, 'Vehicle Not Available', 'The booked vehicle was not available on arrival.', 'In Progress'),
(1, 'Refund Request', 'Requesting refund for cancelled booking.', 'Closed');



UPDATE vehicles 
SET availability = 'Available' 
WHERE vehicle_id = 3;

UPDATE bookings
SET booking_status = 'Confirmed',
    updated_at = GETDATE()
WHERE booking_id = 45;  -- replace 123 with the actual booking_id


DELETE FROM Payments
WHERE payment_id = 1017;

ALTER TABLE Bookings
ADD CONSTRAINT UQ_Booking_Dates 
UNIQUE (user_id, vehicle_id, booking_date, return_date);





-- Create Password Reset Tokens table
CREATE TABLE PasswordResetTokens (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    token NVARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Create index for faster token lookups
CREATE INDEX idx_token ON PasswordResetTokens(token);
CREATE INDEX idx_user_id ON PasswordResetTokens(user_id);

select* from PasswordResetTokens