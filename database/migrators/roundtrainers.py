#!/usr/bin/env python3

import sqlite3
import sys

def round_trainer_ratings(db_path: str):
    """
    Rounds all trainer 'pwtr_rating' values in the database to two decimal places.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Fetch all trainers with a non-NULL pwtr_rating
    cursor.execute("""
        SELECT id, pwtr_rating
        FROM trainer
        WHERE pwtr_rating IS NOT NULL
    """)
    trainers = cursor.fetchall()

    # Update each trainer's pwtr_rating
    for trainer in trainers:
        trainer_id = trainer[0]
        rating = float(trainer[1])
        rounded_rating = round(rating, 2)

        # Update the rounded value in the database
        cursor.execute("""
            UPDATE trainer
            SET pwtr_rating = ?
            WHERE id = ?
        """, (rounded_rating, trainer_id))

    # Commit the changes
    conn.commit()
    conn.close()

    print(f"Rounded pwtr_rating for {len(trainers)} trainers.")

def main():
    """
    Usage:
      python roundtrainers.py db.sqlite
    """
    if len(sys.argv) < 2:
        print("Usage: roundtrainers.py <db.sqlite>")
        sys.exit(1)

    db_path = sys.argv[1]

    # Check if the database file exists
    try:
        round_trainer_ratings(db_path)
    except Exception as e:
        print(f"Error processing the database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
