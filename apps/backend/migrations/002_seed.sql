INSERT INTO affiliates (name) VALUES
('Alice Affiliate'),
('Bob Media'),
('Cora Partners')
ON CONFLICT DO NOTHING;

INSERT INTO campaigns (name) VALUES
('Winter Sale'),
('Spring Promo'),
('Summer Blowout')
ON CONFLICT DO NOTHING;