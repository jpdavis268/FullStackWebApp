-- Aggregate script for initialzing triggers and procedures.
--
-- The creation of the table schema is handled by the class definitions on the backend webserver,
-- which Spring uses to auto-generate the tables in MySQL.
--
-- The generation and insertion of the sample data for the presentation is handled by the script in dataGenerator.py,
-- as it requires logic that would be impractical to implement within this script.

-- Triggers
DROP TRIGGER IF EXISTS on_product_insert;
DROP TRIGGER IF EXISTS on_product_update;
DROP TRIGGER IF EXISTS on_product_delete;
DROP TRIGGER IF EXISTS on_sale_insert;
DROP TRIGGER IF EXISTS on_sale_update;

DELIMITER %%
-- Check that an inserted product is valid and perform needed actions.
CREATE TRIGGER on_product_insert BEFORE INSERT ON product FOR EACH ROW
BEGIN
    DECLARE v_cnt INT DEFAULT 0;

    IF (NEW.price <= 0) THEN SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "Prices must be at least $0.01.";
END IF;
SET NEW.min_age = GREATEST(NEW.min_age, (SELECT department.min_age FROM department WHERE department.department_name = NEW.department_name));

    -- If department doesn't exist, create it with defaults.
    IF NEW.department_name IS NOT NULL AND NEW.department_name <> "" THEN
SELECT COUNT(*) INTO v_cnt FROM department WHERE department_name = NEW.department_name;
IF v_cnt = 0 THEN
            INSERT INTO department VALUES (NEW.department_name, 0, FALSE);
END IF;
END IF;
END;

-- Check that an updated product is valid and perform needed actions.
CREATE TRIGGER on_product_update BEFORE UPDATE ON product FOR EACH ROW
BEGIN
    DECLARE v_cnt INT DEFAULT 0;
    -- If department doesn't exist, create it with defaults.
    IF NEW.department_name IS NOT NULL AND NEW.department_name <> "" THEN
    SELECT COUNT(*) INTO v_cnt FROM department WHERE department_name = NEW.department_name;
    IF v_cnt = 0 THEN
            INSERT INTO department VALUES (NEW.department_name, 0, FALSE);
END IF;
END IF;
END;

-- Clean up when an item is deleted.
CREATE TRIGGER on_product_delete AFTER DELETE ON product FOR EACH ROW
BEGIN
    DELETE FROM member_sale WHERE sale_id = OLD.sale_id;
END;

-- Check that a sale is valid.
CREATE TRIGGER on_sale_insert BEFORE INSERT ON member_sale FOR EACH ROW
BEGIN
    IF (NEW.price_modifier > 1) THEN
        SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "Sales cannot increase item price.";
END IF;
END;

-- Check that a sale remains valid when updated.
CREATE TRIGGER on_sale_update BEFORE UPDATE ON member_sale FOR EACH ROW
BEGIN
    IF (NEW.price_modifier > 1) THEN
        SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "Sales cannot increase item price.";
END IF;
END;
%%
DELIMITER ;

-- Procedures
DROP PROCEDURE IF EXISTS roll_fuel_points;
DROP PROCEDURE IF EXISTS add_member;
DROP PROCEDURE IF EXISTS remove_member;
DROP PROCEDURE IF EXISTS add_item;
DROP PROCEDURE IF EXISTS remove_item;
DROP PROCEDURE IF EXISTS assign_sale;
DROP PROCEDURE IF EXISTS remove_sale;
DROP PROCEDURE IF EXISTS give_fuel_points;
DROP PROCEDURE IF EXISTS withdraw_fuel_points;

DELIMITER %%
-- Roll fuel points forward.
CREATE PROCEDURE roll_fuel_points()
BEGIN
    DECLARE temp_id INT;
    DECLARE temp_fuel_points INT;
    DECLARE end_reached BOOLEAN DEFAULT FALSE;
    DECLARE fuel_cursor CURSOR FOR SELECT card_id, current_month_fuel_points FROM member;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET end_reached = TRUE;
OPEN fuel_cursor;
WHILE (end_reached = FALSE) DO
        FETCH fuel_cursor INTO temp_id, temp_fuel_points;
        IF (temp_id IS NOT NULL) THEN
UPDATE member SET last_month_fuel_points = temp_fuel_points WHERE card_id = temp_id;
UPDATE member SET current_month_fuel_points = 0 WHERE card_id = temp_id;
END IF;
END WHILE;
END;

-- Add a new member.
CREATE PROCEDURE add_member(
    IN p_first_name VARCHAR(16),
    IN p_last_name VARCHAR(16),
    IN p_middle_initial VARCHAR(1),
    IN p_phone_number BIGINT,
    IN p_email VARCHAR(32),
    IN p_address VARCHAR(32),
    IN p_city VARCHAR(32),
    IN p_state VARCHAR(2),
    IN p_zip INT,
    IN p_apartment_num INT
)
BEGIN
UPDATE member SET phone_number = NULL WHERE phone_number = p_phone_number;
INSERT INTO member (phone_number, first_name, middle_initial, last_name, address, apartment_number, city, state, zip, email) VALUES
    (p_phone_number, p_first_name, p_middle_initial, p_last_name, p_address, p_apartment_num, p_city, p_state, p_zip, p_email);
END;

-- Remove a member.
CREATE PROCEDURE remove_member(IN member_id BIGINT)
BEGIN
DELETE FROM member WHERE card_id = member_id;
IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "No member with corresponding ID exists.";
END IF;
END;

-- Add a new item.
CREATE PROCEDURE add_item(
    IN p_item_id BIGINT,
    IN p_name VARCHAR(32),
    IN p_price DECIMAL(10, 2),
    IN p_department VARCHAR(32),
    IN p_min_age INT,
    IN p_priced_by_weight BOOLEAN
)
BEGIN
INSERT INTO product (id, name, price, department_name, min_age, priced_by_weight) VALUES
    (p_item_id, p_name, p_price, NULLIF(p_department, ""), COALESCE(p_min_age, 0), p_priced_by_weight) AS new_item
ON DUPLICATE KEY UPDATE
                     name = new_item.name,
                     price = new_item.price,
                     department_name = new_item.department_name,
                     min_age = new_item.min_age,
                     priced_by_weight = new_item.priced_by_weight;
END;

-- Remove an item.
CREATE PROCEDURE remove_item(IN p_item_id BIGINT)
BEGIN
    DECLARE v_cnt INT DEFAULT 0;
SELECT COUNT(*) INTO v_cnt FROM product WHERE id = p_item_id;
IF v_cnt = 0 THEN
        SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "Item not found.";
ELSE
DELETE FROM product WHERE id = p_item_id;
END IF;
END;

-- Assign a sale to an item.
CREATE PROCEDURE assign_sale(IN p_item_id BIGINT, IN p_price_modifier FLOAT, IN p_required_amount INT, IN p_sale_name VARCHAR(32))
BEGIN
INSERT INTO member_sale (price_modifier, required_amount, sale_name) VALUES (p_price_modifier, p_required_amount, p_sale_name);
UPDATE product SET sale_id = LAST_INSERT_ID() WHERE id = p_item_id;
END;

-- Unassign a sale from an item.
CREATE PROCEDURE remove_sale(IN item_id BIGINT)
BEGIN
	DECLARE to_delete BIGINT;
SELECT sale_id INTO to_delete FROM product WHERE id = item_id;
UPDATE product SET sale_id = NULL WHERE id = item_id;
DELETE FROM member_sale WHERE sale_id = to_delete;
IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "Item has no associated sale.";
END IF;
END;

-- Give a member fuel points.
CREATE PROCEDURE give_fuel_points(IN member_id BIGINT, IN fuel_points INT)
BEGIN
UPDATE member SET current_month_fuel_points = current_month_fuel_points + fuel_points WHERE card_id = member_id;
IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "No member with corresponding ID exists.";
END IF;
END
%%

-- Attempt to withdraw fuel points from a member.
CREATE PROCEDURE withdraw_fuel_points(IN member_id BIGINT, IN fuel_points INT, OUT withdrawn INT)
BEGIN
    DECLARE remaining INT;
    DECLARE curPoints INT;
    DECLARE lastPoints INT;

SELECT current_month_fuel_points, last_month_fuel_points INTO curPoints, lastPoints FROM member WHERE card_id = member_id;
IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE "ERROR" SET MESSAGE_TEXT = "No member wtih corresponding ID exists.";
ELSE
        SET remaining = fuel_points;

        SET withdrawn = LEAST(remaining, lastPoints);
        SET lastPoints = lastPoints - withdrawn;
        SET remaining = remaining - withdrawn;

        IF remaining > 0 THEN
            SET withdrawn = withdrawn + LEAST(remaining, curPoints);
            SET curPoints = curPoints - LEAST(remaining, curPoints);
END IF;

UPDATE member SET current_month_fuel_points = curPoints WHERE card_id = member_id;
UPDATE member SET last_month_fuel_points = lastPoints WHERE card_id = member_id;
END IF;
END
%%
DELIMITER ;