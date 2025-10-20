import psycopg2

conn = psycopg2.connect(
    dbname="malog",
    user="postgres",
    password="admin",
    host="localhost",
    port="5432"
)
cur = conn.cursor()
cur.execute("SELECT * FROM subscriptionplan")
rows = cur.fetchall()
columns = [desc[0] for desc in cur.description]

with open("fixtures/subscription_plans.sql", "w", encoding="utf-8") as f:
    for row in rows:
        values = []
        for v in row:
            if v is None:
                values.append("NULL")
            elif isinstance(v, str):
                values.append("'" + v.replace("'", "''") + "'")
            else:
                values.append(str(v))
        f.write(
            f"INSERT INTO subscriptionplan ({', '.join(columns)}) VALUES ({', '.join(values)});\n"
        )

cur.close()
conn.close()
print("Export complete: fixtures/subscription_plans.sql")