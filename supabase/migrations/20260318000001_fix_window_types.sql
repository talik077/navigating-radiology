-- Change window columns from INTEGER to REAL to support decimal values
ALTER TABLE series ALTER COLUMN window_wc TYPE REAL;
ALTER TABLE series ALTER COLUMN window_ww TYPE REAL;
