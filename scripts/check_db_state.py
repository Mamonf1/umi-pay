# -*- coding: utf-8 -*-
"""فحص حالة قاعدة البيانات الحالية بعد الارتداد"""
import sqlite3

con = sqlite3.connect("/home/z/my-project/db/custom.db")
cur = con.cursor()

tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("TABLES:", tables)

if "User" in tables:
    cols = [c[1] for c in cur.execute("PRAGMA table_info(User)").fetchall()]
    print("\nUser cols:", cols)
    for row in cur.execute('SELECT phone, name, role FROM "User" LIMIT 15').fetchall():
        print(" user:", row)

if "Wallet" in tables:
    cols = [c[1] for c in cur.execute("PRAGMA table_info(Wallet)").fetchall()]
    print("\nWallet cols:", cols)

if "CurrencySettings" in tables:
    for row in cur.execute('SELECT * FROM "CurrencySettings"').fetchall():
        print("\nCurrencySettings:", row)

con.close()
