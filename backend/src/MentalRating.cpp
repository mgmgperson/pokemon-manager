#include "MentalRating.h"
#include <iostream>

// Default constructor with "empty" values
MentalRating::MentalRating() : 
    id(0), rating_id(0),
    planning_rating(0), risk_rating(0), prediction_rating(0),
    clutch_rating(0), consistency_rating(0), motivation_rating(0),
    pokemon_knowledge_rating(0), trainer_knowledge_rating(0),
    training_rating(0), conditioning_rating(0), determination_rating(0),
    facilities_rating(0), attack_rating(0), defense_rating(0),
    speed_rating(0), gimmick_rating(0)
{}

MentalRating::MentalRating(int ratingId) : MentalRating() {
    this->rating_id = ratingId;
}

// This queries mental_rating by ratingId
MentalRating MentalRating::fetchByRatingId(int ratingId) {
    sqlite3* db;
    int rc = sqlite3_open("../../database/db.sqlite", &db);
    if (rc) {
        std::cerr << "Could not open DB: " << sqlite3_errmsg(db) << std::endl;
        sqlite3_close(db);
        return MentalRating();
    }

    std::string sql = R"SQL(
        SELECT id, rating_id,
               planning_rating, risk_rating, prediction_rating, clutch_rating, consistency_rating, motivation_rating, 
               pokemon_knowledge_rating, trainer_knowledge_rating,
               training_rating, conditioning_rating, determination_rating, facilities_rating,
               attack_rating, defense_rating, speed_rating, gimmick_rating
        FROM mental_rating
        WHERE rating_id = ?
    )SQL";

    sqlite3_stmt* stmt;
    MentalRating mr;

    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, ratingId);

        if (sqlite3_step(stmt) == SQLITE_ROW) {
            mr.id = sqlite3_column_int(stmt, 0);
            mr.rating_id = sqlite3_column_int(stmt, 1);
            mr.planning_rating = sqlite3_column_int(stmt, 2);
            mr.risk_rating = sqlite3_column_int(stmt, 3);
            mr.prediction_rating = sqlite3_column_int(stmt, 4);
            mr.clutch_rating = sqlite3_column_int(stmt, 5);
            mr.consistency_rating = sqlite3_column_int(stmt, 6);
            mr.motivation_rating = sqlite3_column_int(stmt, 7);
            mr.pokemon_knowledge_rating = sqlite3_column_int(stmt, 8);
            mr.trainer_knowledge_rating = sqlite3_column_int(stmt, 9);
            mr.training_rating = sqlite3_column_int(stmt, 10);
            mr.conditioning_rating = sqlite3_column_int(stmt, 11);
            mr.determination_rating = sqlite3_column_int(stmt, 12);
            mr.facilities_rating = sqlite3_column_int(stmt, 13);
            mr.attack_rating = sqlite3_column_int(stmt, 14);
            mr.defense_rating = sqlite3_column_int(stmt, 15);
            mr.speed_rating = sqlite3_column_int(stmt, 16);
            mr.gimmick_rating = sqlite3_column_int(stmt, 17);
        }
    } else {
        std::cerr << "Failed to prepare statement: " << sqlite3_errmsg(db) << std::endl;
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return mr;
}

// Insert or Update logic
void MentalRating::saveToDB() {
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
            INSERT INTO mental_rating (
                rating_id,
                planning_rating, risk_rating, prediction_rating, clutch_rating, consistency_rating, motivation_rating, 
                pokemon_knowledge_rating, trainer_knowledge_rating,
                training_rating, conditioning_rating, determination_rating, facilities_rating,
                attack_rating, defense_rating, speed_rating, gimmick_rating
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        )SQL";
    } else {
        sql = R"SQL(
            UPDATE mental_rating SET
                planning_rating=?, risk_rating=?, prediction_rating=?, clutch_rating=?, consistency_rating=?, motivation_rating=?, 
                pokemon_knowledge_rating=?, trainer_knowledge_rating=?,
                training_rating=?, conditioning_rating=?, determination_rating=?, facilities_rating=?,
                attack_rating=?, defense_rating=?, speed_rating=?, gimmick_rating=?
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
    sqlite3_bind_int(stmt, idx++, planning_rating);
    sqlite3_bind_int(stmt, idx++, risk_rating);
    sqlite3_bind_int(stmt, idx++, prediction_rating);
    sqlite3_bind_int(stmt, idx++, clutch_rating);
    sqlite3_bind_int(stmt, idx++, consistency_rating);
    sqlite3_bind_int(stmt, idx++, motivation_rating);
    sqlite3_bind_int(stmt, idx++, pokemon_knowledge_rating);
    sqlite3_bind_int(stmt, idx++, trainer_knowledge_rating);
    sqlite3_bind_int(stmt, idx++, training_rating);
    sqlite3_bind_int(stmt, idx++, conditioning_rating);
    sqlite3_bind_int(stmt, idx++, determination_rating);
    sqlite3_bind_int(stmt, idx++, facilities_rating);
    sqlite3_bind_int(stmt, idx++, attack_rating);
    sqlite3_bind_int(stmt, idx++, defense_rating);
    sqlite3_bind_int(stmt, idx++, speed_rating);
    sqlite3_bind_int(stmt, idx++, gimmick_rating);

    if (!isInsert) {
        sqlite3_bind_int(stmt, idx++, id);
    }

    if (sqlite3_step(stmt) != SQLITE_DONE) {
        std::cerr << "Failed to (insert/update) mental_rating: " << sqlite3_errmsg(db) << std::endl;
    } else {
        if (isInsert) {
            id = (int)sqlite3_last_insert_rowid(db);
        }
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
}

std::map<std::string, int> MentalRating::toMap() const {
    std::map<std::string, int> out;
    out["id"] = id;
    out["rating_id"] = rating_id;
    out["planning_rating"] = planning_rating;
    out["risk_rating"] = risk_rating;
    out["prediction_rating"] = prediction_rating;
    out["clutch_rating"] = clutch_rating;
    out["consistency_rating"] = consistency_rating;
    out["motivation_rating"] = motivation_rating;
    out["pokemon_knowledge_rating"] = pokemon_knowledge_rating;
    out["trainer_knowledge_rating"] = trainer_knowledge_rating;
    out["training_rating"] = training_rating;
    out["conditioning_rating"] = conditioning_rating;
    out["determination_rating"] = determination_rating;
    out["facilities_rating"] = facilities_rating;
    out["attack_rating"] = attack_rating;
    out["defense_rating"] = defense_rating;
    out["speed_rating"] = speed_rating;
    out["gimmick_rating"] = gimmick_rating;
    return out;
}
