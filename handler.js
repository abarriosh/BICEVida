'use strict';
const roundTo = require('round-to');

module.exports.policy = (event, context, callback) => {
  
  var Request = require("request");
  let res;
  let totalPolicyCost = 0;
  let workerCost;
  const lifeHealthNoChildUF = 0.279;
  const lifeHealthOneChildUF = 0.4396;
  const lifeHealthMoreChildsUF = 0.5599;
  const dentalNoChildUF = 0.12;
  const dentalOneChildUF = 0.1950;
  const dentalMoreChildsUF = 0.2480;
 
  console.log("Searching Policy Info...");
  Request.get("https://dn8mlk7hdujby.cloudfront.net/interview/insurance/policy", (error, response, body) => {
      if(error) {
          console.log('Failed to load data. Error JSON:', JSON.stringify(error, null, 2))
          callback(error);
      }
      
      res = JSON.parse(body);

      let companyPaymentFactor = res.policy.company_percentage / 100;
      let hasDentalCare = res.policy.has_dental_care;
     
      res.policy.workers.forEach(element =>{
          
          element.companyWorkerCost = "S/C"
          element.workerCopayment = "S/C"
          element.totalWorkerCost = "S/C"

          if (element.age <= 65){
                
              switch (element.childs) {
                case 0:
                  workerCost = lifeHealthNoChildUF + (hasDentalCare ? dentalNoChildUF : 0);
                  break;
                case 1:
                  workerCost = lifeHealthOneChildUF + (hasDentalCare ? dentalOneChildUF : 0);
                  break;
                default:
                  workerCost = lifeHealthMoreChildsUF + (hasDentalCare ? dentalMoreChildsUF : 0);
                  break;
              }

              totalPolicyCost = totalPolicyCost + workerCost;
              element.companyWorkerCost = roundTo.down(workerCost * companyPaymentFactor, 4);
              element.workerCopayment = roundTo.down(workerCost - element.companyWorkerCost, 4);
              element.totalWorkerCost = roundTo.down(workerCost, 4);
         
         }

      });

        
      res.policy.totalPolicyCost = roundTo.down(totalPolicyCost, 4);
      
      console.log("Policy costs were calculated.")
      return callback(null, {
                statusCode: 200,
                body: JSON.stringify(
                   res,
                   null,
                   2
                )
      });
  });
};