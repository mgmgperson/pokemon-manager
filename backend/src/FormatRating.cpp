#include "FormatRating.h"
#include <iostream>

FormatRating::FormatRating()
    : id(0), rating_id(0),
      singles_rating(0), doubles_rating(0), tag_battle_rating(0),
      battle_factory_rating(0), rotation_rating(0), sixes_rating(0),
      threes_rating(0), twos_rating(0)
{}

FormatRating::FormatRating(int ratingId) : FormatRating() {
    this->rating_id = ratingId;
}

// Fetch format_rating row by rating_id
FormatRating FormatRating::fetchByRatingId(int ratingId) {
    sqlite3* db;
    int rc = sqlite3_open("../../database/db.sqlite", &db);
    if (rc) {
        std::cerr << "Could not open DB: " << sqlite3_errmsg(db) << std::endl;
        sqlite3_close(db);
        return FormatRating();
    }

    std::string sql = R"SQL(
        SELECT id, rating_id,
               singles_rating, doubles_rating, tag_battle_rating, battle_factory_rating,
               rotation_rating, sixes_rating, threes_rating, twos_rating
        FROM format_rating
        WHERE rating_id = ?
    )SQL";

    sqlite3_stmt* stmt;
    FormatRating fr;

    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, ratingId);

        if (sqlite3_step(stmt) == SQLITE_ROW) {
            fr.id = sqlite3_column_int(stmt, 0);
            fr.rating_id = sqlite3_column_int(stmt, 1);
            fr.singles_rating = sqlite3_column_int(stmt, 2);
            fr.doubles_rating = sqlite3_column_int(stmt, 3);
            fr.tag_battle_rating = sqlite3_column_int(stmt, 4);
            fr.battle_factory_rating = sqlite3_column_int(stmt, 5);
            fr.rotation_rating = sqlite3_column_int(stmt, 6);
            fr.sixes_rating = sqlite3_column_int(stmt, 7);
            fr.threes_rating = sqlite3_column_int(stmt, 8);
            fr.twos_rating = sqlite3_column_int(stmt, 9);
        }
    } else {
        std::cerr << "Failed to prepare statement: " << sqlite3_errmsg(db) << std::endl;
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return fr;
}

void FormatRating::saveToDB() {
    sqlite3* db;
    int rc = sqlite3_open("../../database/db.sqlite", &db);
    if (rc) {
        std::cerr << "Could not open DB: " << sqlite3_errmsg(db) << std::endl;
        sqlite3_close(db);
        return;
    }

    bool isInsert = (id == 0);
    std::string sql;
    if (isInsert) {
        sql = R"SQL(
            INSERT INTO format_rating (
                rating_id,
                singles_rating, doubles_rating, tag_battle_rating, battle_factory_rating,
                rotation_rating, sixes_rating, threes_rating, twos_rating
            ) VALUES (?,?,?,?,?,?,?,?,?)
        )SQL";
    } else {
        sql = R"SQL(
            UPDATE format_rating SET
                singles_rating=?, doubles_rating=?, tag_battle_rating=?, battle_factory_rating=?,
                rotation_rating=?, sixes_rating=?, threes_rating=?, twos_rating=?
            WHERE id=?
        )SQL";
    }

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
        std::cerr << "Failed to prepare (insert/update) statement: " << sqlite3_errmsg(db) << std::endl;
        sqlite3_close(db);
        return;
    }

    int idx = 1;
    if (isInsert) {
        sqlite3_bind_int(stmt, idx++, rating_id);
    }
    sqlite3_bind_int(stmt, idx++, singles_rating);
    sqlite3_bind_int(stmt, idx++, doubles_rating);
    sqlite3_bind_int(stmt, idx++, tag_battle_rating);
    sqlite3_bind_int(stmt, idx++, battle_factory_rating);
    sqlite3_bind_int(stmt, idx++, rotation_rating);
    sqlite3_bind_int(stmt, idx++, sixes_rating);
    sqlite3_bind_int(stmt, idx++, threes_rating);
    sqlite3_bind_int(stmt, idx++, twos_rating);

    if (!isInsert) {
        sqlite3_bind_int(stmt, idx++, id);
    }

    if (sqlite3_step(stmt) != SQLITE_DONE) {
        std::cerr << "Failed to (insert/update) format_rating: " << sqlite3_errmsg(db) << std::endl;
    } else {
        if (isInsert) {
            id = (int)sqlite3_last_insert_rowid(db);
        }
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
}

std::map<std::string, int> FormatRating::toMap() const {
    std::map<std::string, int> out;
    out["id"] = id;
    out["rating_id"] = rating_id;
    out["singles_rating"] = singles_rating;
    out["doubles_rating"] = doubles_rating;
    out["tag_battle_rating"] = tag_battle_rating;
    out["battle_factory_rating"] = battle_factory_rating;
    out["rotation_rating"] = rotation_rating;
    out["sixes_rating"] = sixes_rating;
    out["threes_rating"] = threes_rating;
    out["twos_rating"] = twos_rating;
    return out;
}
