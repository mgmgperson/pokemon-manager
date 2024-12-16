#include "Rating.h"
#include <sqlite3.h>
#include <iostream>

Rating::Rating() :
    id(0),
    trainer_id(0),
    year(0),
    overall_rating(0),
    typing_rating(0),
    mixed_rating(0),
    special_rating(0)
{}

Rating Rating::fetchLatestByTrainerId(int trainerId) {
    sqlite3* db;
    int rc = sqlite3_open("../../database/db.sqlite", &db);
    if (rc) {
        std::cerr << "Could not open DB: " << sqlite3_errmsg(db) << std::endl;
        sqlite3_close(db);
        return Rating();
    }

    // We pick the rating with the largest 'year' for that trainer
    std::string sql = 
        "SELECT id, trainer_id, year, overall_rating, typing_rating, mixed_rating, special_rating "
        "FROM rating "
        "WHERE trainer_id = ? "
        "ORDER BY year DESC LIMIT 1";

    sqlite3_stmt* stmt;
    Rating r;

    if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, trainerId);

        if (sqlite3_step(stmt) == SQLITE_ROW) {
            r.id = sqlite3_column_int(stmt, 0);
            r.trainer_id = sqlite3_column_int(stmt, 1);
            r.year = sqlite3_column_int(stmt, 2);
            r.overall_rating = sqlite3_column_int(stmt, 3);
            r.typing_rating = sqlite3_column_int(stmt, 4);
            r.mixed_rating = sqlite3_column_int(stmt, 5);
            r.special_rating = sqlite3_column_int(stmt, 6);
        } else {
            std::cerr << "No rating found for trainer_id=" << trainerId << std::endl;
        }
    } else {
        std::cerr << "Failed to prepare statement for fetchLatestByTrainerId: " 
                  << sqlite3_errmsg(db) << std::endl;
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return r;
}
