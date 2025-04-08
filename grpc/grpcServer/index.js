const { Server } = require("./grpcServer");
const { getMatchCompetitionsByType, getMatchDatesByCompetitionId, getMatchDatesByCompetitionIdAndDate, sendUpdateDeleteReason, matchDetailsHandler, raceDetails, cardDetails, listMatchSuperAdmin, listRacingMatchSuperAdmin, racingCountryCodeListSuperAdmin, getTournamentBettingDetails, getBlinkingTabsData, getSessions } = require("./handlers/matchHandler");
const { createUser, updateUserHandler, changePassword, expertList, lockUnlockUser, getNotificationHandler, isUserExist } = require("./handlers/userHandler");

const { GRPC_PORT = 60600 } = process.env;

const protoOptionsArray = [
    {
        path: `${__dirname}/proto/user.proto`, //path to proto file
        package: "userProvider",//package in proto name
        service: "UserService",//service name in proto file
    }, {
        path: `${__dirname}/proto/match.proto`, //path to proto file
        package: "matchProvider",//package in proto name
        service: "MatchProvider",//service name in proto file
    }, {
        path: `${__dirname}/proto/bet.proto`, //path to proto file
        package: "betsProvider",//package in proto name
        service: "BetsProvider",//service name in proto file
    }

];

const server = new Server(`${GRPC_PORT}`, protoOptionsArray);
server
    .addService("UserService", "CreateExpert", createUser)
    .addService("UserService", "UpdateExpert", updateUserHandler)
    .addService("UserService", "ChangePasswordExpert", changePassword)
    .addService("UserService", "GetExpertList", expertList)
    .addService("UserService", "LockUnlockExpert", lockUnlockUser)
    .addService("UserService", "GetNotification", getNotificationHandler)
    .addService("UserService", "IsUserExist", isUserExist)

    .addService("MatchProvider", "GetMatchCompetitions", getMatchCompetitionsByType)
    .addService("MatchProvider", "GetMatchDates", getMatchDatesByCompetitionId)
    .addService("MatchProvider", "GetMatchesByDate", getMatchDatesByCompetitionIdAndDate)
    .addService("MatchProvider", "MatchDetail", matchDetailsHandler)
    .addService("MatchProvider", "RaceDetail", raceDetails)
    .addService("MatchProvider", "CardDetail", cardDetails)
    .addService("MatchProvider", "MatchList", listMatchSuperAdmin)
    .addService("MatchProvider", "RaceList", listRacingMatchSuperAdmin)
    .addService("MatchProvider", "RaceCountryCodeList", racingCountryCodeListSuperAdmin)
    .addService("MatchProvider", "GetTournamentBetting", getTournamentBettingDetails)
    .addService("MatchProvider", "BlinkingTabs", getBlinkingTabsData)
    .addService("MatchProvider", "SessionDetail", getSessions)

    .addService("BetsProvider", "ChangeBetsDeleteReason", sendUpdateDeleteReason)

// gRPC methods implementation



module.exports = server;