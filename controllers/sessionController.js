
const { addSessionBetting, getSessionBettingById, updateSessionBetting, getSessionBetting, getSessionBettings } = require("../services/sessionBettingService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const {getUserById} = require("../services/userService");
const { sessionBettingType, teamStatus } = require("../config/contants");
const { getMatchById } = require("../services/matchService");
exports.addSession = async (req,res) =>{
    try {
      let {matchId,type,name,minBet,maxBet,yesRate,noRate,yesPercent,noPercent,selectionId} = req.body
      const { id: loginId, role } = req.user;
      if(type == sessionBettingType.marketSession && !selectionId){
        return ErrorResponse({statusCode: 400,message: {msg: "required", keys : {name : "Selection id"} }},req,res);
      }
      
      const user = await getUserById(loginId,["allPrivilege","sessionMatchPrivilege","betFairMatchPrivilege"]);
      if(!user){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
      }
      let match = await getMatchById(matchId,["id","createBy","betFairSessionMinBet","betFairSessionMaxBet"])
      if(!match){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Match"}}},req,res);
      }
      if(match.createBy != loginId){
        if(!user.allPrivilege){
          if(!user.sessionMatchPrivilege && !user.betFairMatchPrivilege){
            return ErrorResponse({statusCode: 403,message: {msg: "notAuthorized",keys: {name: "User"}}},req,res);
          }
        }
      }
   
      if(!minBet){
        minBet = match.betFairSessionMinBet
      }
      if(!maxBet){
        maxBet = match.betFairSessionMaxBet
      }
      if(selectionId){
        type = sessionBettingType.marketSession
      }
      let status = teamStatus.suspended
      if(yesRate || noRate){
        status = teamStatus.active
      }
      let sessionData = {
        matchId,
        type,
        name,
        minBet,
        maxBet,
        yesRate,
        noRate,
        yesPercent,
        noPercent,
        selectionId,
        status,
        createBy: loginId
      }
      let session = await addSessionBetting(sessionData)
      if(!session){
        return ErrorResponse({statusCode: 400,message: {msg: "match.sessionAddFail" }},req,res);
      }
      return SuccessResponse(
        {
          statusCode: 200,
          message: {
            msg: "created",
            keys: {
              name: "Session",
            },
          },
          data : session
        },
        req,
        res
      );
    } catch (error) {
      return ErrorResponse(error, req, res);
    }
  }
  
  //update session betting general data
  
  exports.updateSession = async (req,res) =>{
    try {
      let {id,name,minBet,maxBet} = req.body
      const { id: loginId, role } = req.user;
      const user = await getUserById(loginId,["allPrivilege","sessionMatchPrivilege","betFairMatchPrivilege"]);
      if(!user){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
      }

      let session = await getSessionBettingById(id,["id","createBy","name","minBet","maxBet"])
      if(!session){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Session"}}},req,res);
      }

      if(session.createBy != loginId){
        if(!user.allPrivilege){
          if(!user.sessionMatchPrivilege && !user.betFairMatchPrivilege){
            return ErrorResponse({statusCode: 403,message: {msg: "notAuthorized",keys: {name: "User"}}},req,res);
          }
        }
      }
  
      let sessionData = {
        name : name || session.name,
        minBet : minBet || session.minBet,
        maxBet : maxBet || session.maxBet
      }
      let updatedSession = await updateSessionBetting({id},sessionData)
      if(!updatedSession){
        return ErrorResponse({statusCode: 400,message: {msg: "match.sessionUpdateFail" }},req,res);
      }
      return SuccessResponse(
        {
          statusCode: 200,
          message: {
            msg: "updated",
            keys: {
              name: "Session",
            },
          },
          data : sessionData
        },
        req,
        res
      );
    } catch (error) {
      return ErrorResponse(error, req, res);
    }
  }

exports.getSessions = async (req,res) =>{
    try {
        let crieteria = {}
        if(req.query.id){
            crieteria.id = req.query.id
        }
        if(req.query.matchId){
            crieteria.matchId = req.query.matchId
        }
        if(req.query.type){
            crieteria.type = req.query.type
        }
        let session = await getSessionBettings(crieteria,["id","matchId","type","name","minBet","maxBet","yesRate","noRate","yesPercent","noPercent","selectionId","status"])
        if(!session){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Session"}}},req,res);
        }
        return SuccessResponse(
        {
            statusCode: 200,
            message: {
            msg: "success",
            keys: {
                name: "Session",
            },
            },
            data : session
        },
        req,
        res
        );
    } catch (error) {
        return ErrorResponse(error, req, res);
    }
}