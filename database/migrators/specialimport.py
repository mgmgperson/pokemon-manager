import sqlite3

# Database file path
SQLITE_DB = "../db.sqlite"

def update_active_status(conn):
    """Fix active_status based on pwtr_rating and birthdate."""
    cur = conn.cursor()

    # Select trainers with birthdate that need active_status fixed
    cur.execute("SELECT id, pwtr_rating, active_status FROM trainer WHERE birthdate IS NOT NULL")
    trainers = cur.fetchall()

    updates = []
    for trainer_id, pwtr_rating, active_status in trainers:
        if pwtr_rating is None and active_status is None:
            updates.append((0, trainer_id))  # Set active_status = 0 (inactive)
        elif pwtr_rating is not None and active_status is None:
            updates.append((1, trainer_id))  # Set active_status = 1 (active)

    # Apply updates
    if updates:
        cur.executemany("UPDATE trainer SET active_status = ? WHERE id = ?", updates)
        conn.commit()
        print(f"Updated active_status for {len(updates)} trainers.")
    else:
        print("No active_status updates needed.")

def update_trainer_region(conn):
    """Fix region_id based on first found hometown."""
    cur = conn.cursor()

    # Select trainers with null region_id
    cur.execute("SELECT id FROM trainer WHERE region_id IS NULL")
    trainers = cur.fetchall()

    updates = []
    for (trainer_id,) in trainers:
        # Get the first hometown found for the trainer
        cur.execute("SELECT city_id FROM trainer_hometown WHERE trainer_id = ? LIMIT 1", (trainer_id,))
        hometown = cur.fetchone()
        if hometown:
            city_id = hometown[0]

            # Get the region_id from the city
            cur.execute("SELECT region_id FROM city WHERE id = ?", (city_id,))
            region = cur.fetchone()
            if region:
                region_id = region[0]
                updates.append((region_id, trainer_id))

    # Apply updates
    if updates:
        cur.executemany("UPDATE trainer SET region_id = ? WHERE id = ?", updates)
        conn.commit()
        print(f"Updated region_id for {len(updates)} trainers.")
    else:
        print("No region_id updates needed.")

def main():
    conn = sqlite3.connect(SQLITE_DB)
    update_active_status(conn)
    update_trainer_region(conn)
    conn.close()

if __name__ == "__main__":
    main()
