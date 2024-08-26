#include "SinglesMatch.h"
#include <random>
#include <iostream>

SinglesMatch::SinglesMatch(Trainer& t1, Trainer& t2) : trainer1(t1), trainer2(t2), winner(nullptr) {}

void SinglesMatch::simulate() {
    double ratingDiff = trainer1.getRating() - trainer2.getRating();
    double winProbability = 1.0 / (1.0 + pow(10, -ratingDiff / 400.0));


    std::random_device rd;
    std::mt19937 gen(rd());
    std::bernoulli_distribution d(winProbability);

    winner = d(gen) ? &trainer1 : &trainer2;
}

Trainer& SinglesMatch::getWinner() {
    return *winner;
}
