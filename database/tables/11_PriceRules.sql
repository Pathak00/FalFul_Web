CREATE TABLE PriceRules (
    Id        INT             IDENTITY(1,1) PRIMARY KEY,
    RuleKey   NVARCHAR(60)    NOT NULL UNIQUE,
    RuleName  NVARCHAR(150)   NOT NULL,
    Value     DECIMAL(10,2)   NOT NULL DEFAULT 0,
    Unit      NVARCHAR(10)    NOT NULL DEFAULT 'flat',  -- flat | percent
    IsActive  BIT             NOT NULL DEFAULT 1,
    UpdatedAt DATETIME2       NULL
);

INSERT INTO PriceRules (RuleKey, RuleName, Value, Unit, IsActive)
VALUES
    ('delivery_fee',         'Delivery Fee',                 50.00, 'flat',    1),
    ('service_fee_percent',  'Service Fee (%)',               5.00, 'percent', 1),
    ('bowl_container_fee',   'Bowl Container Fee',           30.00, 'flat',    1),
    ('box_container_fee',    'Box Container Fee',            20.00, 'flat',    1),
    ('min_order_amount',     'Minimum Order Amount',        200.00, 'flat',    1),
    ('free_delivery_above',  'Free Delivery Above Amount', 1000.00, 'flat',    1);
