var express = require('express');
var router = express.Router();

var extend = require('util')._extend,
    fs = require('fs'),
    request = require('request'),
    querystring = require('querystring'),
    marked = require('marked');

var idpRoot = process.env.IDP_ROOT || "http://localhost:9090",
    idps = require("./lib/idps.json"),
    dbURL = 'http://govuk-verify-db.herokuapp.com/prototypes/stable';

console.log("IDP root: " + idpRoot);

var serviceLOA = ""

var getServices = function (callback){
  console.log("get services data");

  request(dbURL, function (error, response, body) {
    if (!error && response.statusCode == 200) {

      services = JSON.parse(body);
      callback();

    } else {
      callback(error);
    }
  });

};

var getService = function(req){
  var requestId = (req.query) ? req.query.requestId : req;

  console.log("getService("+requestId+")");

  if (!services[requestId]){
    return false;
  } else {
    return services[requestId];
  }
};

function getIDPBySlug(slug) {
  for (var i = idps.length - 1; i >= 0; i--) {
    if (slug == idps[i].slug) {
      return idps[i];
    }
  };

  return false;
}

function toArray(obj){
  var array = [];

  for (var i in obj){
    array.push(obj[i]);
  }

  return array;
};


router.use(function (req, res, next) {
  // send common data to every view:
  // service, IDP root

  var requestId = req.query.requestId || "dvla";

  getServices(function (error) {
    if (error) {
      res.status(500).send(error);
      return;
    }

    var service = getService(requestId);

    if (!service){
      res.status(404).send("Service not found");
      return;
    }

    var viewData = {};
    viewData.formData = "";
    viewData.formQuery = "?";
    viewData.formHash = {};

    for (var name in req.query){
      var value = req.query[name];

      if (typeof value == "object") {
        for (var i in value) {
          viewData.formData += '<input type="hidden" name="'+name+'['+i+']" value="' + value[i] + '">\n';
          viewData.formQuery += name + '['+i+']' + "=" + value[i] + "&";
        }
      } else {
        viewData.formData += '<input type="hidden" name="'+name+'" value="' + value + '">\n';
        viewData.formQuery += name + "=" + value + "&";
      }

      viewData.formHash[name] = value;
    }

    if (viewData.formQuery.length>1){
      viewData.formQuery = viewData.formQuery.slice(0,-1);
    }

    viewData.requestId = requestId;
    viewData.request = request;
    viewData.idpRoot = idpRoot;
    viewData.serviceName = service.name;
    viewData.serviceLOA = service.LOA;
    viewData.serviceAcceptsLOA1 = (service.LOA == "2,1");
    viewData.userLOAis2 = (req.query.userLOA == "2");
    viewData.serviceNameLower = service.name[0].toLowerCase() + service.name.substring(1);
    viewData.serviceProvider = service.provider;
    viewData.serviceOtherWays = (service.otherWays) ? marked(service.otherWays) : "";
    viewData.servicewhyVerifysUsed = service.whyVerifysUsed;
    viewData.serviceStartURL = service.urls.start
    viewData.serviceCompleteURL = service.urls.end

    viewData.query = req.query;


    if (req.query.idp){
      viewData.idp = getIDPBySlug(req.query.idp);
    }

    var serviceLOA = viewData.serviceLOA

    extend(res.locals, viewData);

    next();

  });
});

router.get('/', function (req, res) {

    var data = {};

  data.idps = idps;

  console.log(data)

  res.render('index', data);
});

// Temp routing for LOA1 uplift for driving-with-medical-condition
// router.get('/intro', function(req, res) {

//   // if (res.locals.serviceLOA == "0"){
//   //   res.redirect("/intro?userLOA=0" + res.locals.formQuery)

//   // } else {

//   res.render('intro' + "?userLOA=0");
  
//   }

// })

router.get('/about', function (req, res) {

  var service = getService(res.locals.requestId);
  serviceLOA = service.LOA;


  if (req.query.selection == "false") {
    res.redirect('/sign-in' + '?userLOA=1&requestId=' + res.locals.requestId)
  
  // } else if (serviceLOA == "1" || serviceLOA == "0"){
  //   console.log('serviceLOA: ' + serviceLOA)
  //   res.redirect('/loa1-signin'+res.locals.formQuery);
  
  } else {
    console.log('serviceLOA: ' + serviceLOA)
    res.render('about');
  }
});

router.get('/select-signin', function (req, res) {
console.log(serviceLOA)
  if (req.query.eidas != "true") {
  res.redirect('/intro' + res.locals.formQuery);
  } else {
    res.render('select-signin');
  }
});

router.get('/about-choosing-a-company', function (req, res) {

  if (res.locals.serviceLOA == "0") {
    res.redirect('/choose-a-certified-company' + res.locals.formQuery + '&above_age_threshold=true&resident_last_12_months=true&driving_licence=true&driving_licence_issuer=true&passport=true&bank_account=true&debit_card=true&credit_card=true&mobile_phone=true&apps=true');

  } else {
    res.render('about-choosing-a-company');
  }
});


router.get('/select-your-documents', function (req, res) {

  var query = req.query;
  
  if (query.resident_last_12_months == "false") {
    res.redirect('/unlikely-to-verify'+res.locals.formQuery);
  
  } else {
    res.render('select-your-documents');
  }
});
  


router.get('/select-other-documents', function (req, res) {
  var query = req.query;
  if  (query.passport == "true" && query.driving_licence == "true") {
    res.redirect('/select-proof-of-address' + res.locals.formQuery);
  } else {
    res.render('select-other-documents');
  }
});

router.get('/select-phone', function (req, res) {
  var query = req.query;
  if  (query.passport != "true" && query.driving_licence != "true" && query.non_uk_passport != "true" && query.bank_account != "true" && query.credit_card != "true") {
    res.redirect('/no-documents' + res.locals.formQuery);
  } else {
    res.render('select-phone');
  }
});


router.get('/choose-a-certified-company', function (req, res) {

  var query = req.query;
  if (query.mobile_phone == "false" && query.landline == "false") {
    res.redirect('/no-mobile-phone'+res.locals.formQuery);
  } else {

    var available_idps = [],
        unavailable_idps = [];

    var addValidCompany = function (slugs){
      slugs = [].concat(slugs);
      slugs.forEach(function(slug){
        available_idps.push(
          getIDPBySlug(slug)
        );
      });
    }

    var addInvalidCompany = function (slugs){
      slugs = [].concat(slugs);
      slugs.forEach(function(slug){
        unavailable_idps.push(
          getIDPBySlug(slug)
        );
      });
    }

    var removeValidCompany = function (slug) {
      available_idps.forEach(function(idp, i) {
        if (idp.slug == slug) {
          available_idps.splice(i, 1);
        }
      });
    }

    var removeInvalidCompany = function (slug) {
      unavailable_idps.forEach(function(idp, i) {
        if (idp.slug == slug) {
          unavailable_idps.splice(i, 1);
        }
      });
    }

    if (query.passport == "true" && query.driving_licence == "true") {
      // 2 docs
      console.log("2 docs");

      var tempValid = ["post-office", "digidentity", "barclays", "experian", "morpho", "citizensafe", "royal-mail"];
      var tempInvalid = [];

      if (query.app != "true" && query.mobile == "true") {
        tempValid.splice(tempValid.indexOf("morpho"), 1);
        tempInvalid.push("morpho");
      }

      if (query.landline == "true") {
        tempValid = ["experian"];
        tempInvalid = ["barclays","citizensafe","digidentity","post-office","royal-mail","morpho",];
      }

      addValidCompany(tempValid);
      addInvalidCompany(tempInvalid);

    } else if (query.passport == "true" || query.driving_licence == "true") {
      // 1 doc
      console.log("1 doc");

      var tempValid = ["barclays", "post-office", "experian", "digidentity", "citizensafe", "royal-mail", "morpho"];
      var tempInvalid = [];

      if (query.app == "true" && query.mobile == "true" ) {
        tempValid.splice(tempValid.indexOf("morpho"), 1);
        tempValid.splice(tempValid.indexOf("digidentity"), 1);
        tempValid.splice(tempValid.indexOf("post-office"), 1);

        tempInvalid.push("morpho");
        tempInvalid.push("digidentity");
        tempInvalid.push("post-office");

      } else if (query.landline == "true") {
        tempValid = ["experian"];
        tempInvalid = ["barclays","citizensafe","digidentity","post-office","royal-mail","morpho",];
      }

      addValidCompany(tempValid);
      addInvalidCompany(tempInvalid);

    } else if (query.no_documents == "true" || (query.passport != "true" && query.driving_licence != "true")) {
      // no docs
      console.log("0 docs");

      var tempValid = ["experian","morpho","barclays"];
      var tempInvalid = [ "post-office", "digidentity", "royal-mail","citizensafe",];

      if (query.app != "true" && query.mobile == "true") {
        tempValid.splice(tempValid.indexOf("morpho"), 1);
        tempInvalid.push("morpho");
      }

      if (query.landline == true) {
        tempValid.splice(tempValid.indexOf("morpho"), 1);
        tempInvalid.push("morpho");
      }

      addValidCompany(tempValid);
      addInvalidCompany(tempInvalid);
    }

    if (query.non_uk_id_document == "true") {
      // non UK doc
      console.log("non UK doc");

      if (tempValid.indexOf('digidentity') < 0) {
        addValidCompany(['digidentity', 'post-office']);
      }

      if (tempInvalid.indexOf('digidentity') > -1) {
        removeInvalidCompany(['digidentity', 'post-office']);
      }
    }

    var data = {
      "available_idps" : available_idps,
      "unavailable_idps" : unavailable_idps
    };

    console.log(JSON.stringify(data, null, "  "));

    res.render('choose-a-certified-company', data);
  }
});

router.get('/redirect-to-idp', function(req,res){

  var verify = req.query.verify;

  res.render("redirect-to-idp", { verify : verify });

});


router.get('/verify-success', function(req,res){

  if (req.query.action == "sign-in") {
    res.redirect('/wait-for-match' + res.locals.formQuery);
  } else {
    res.redirect('/confirmation' + res.locals.formQuery);
    
  }
});

router.get('/fail', function (req, res) {

  var data = {};

  data.idps = idps;

  console.log(data)

  res.render("fail", data);
});

router.get('/confirmation', function (req, res) {

  var data = {};

  data.idps = idps;

  console.log(data)

  res.render("confirmation", data);
});

router.get('/third-cycle-matching', function (req, res) {
  var viewData = {};
  var data = {};
  var query

  if (req.query.third_cycle_done == "true"){
    console.log(req.query.uplifturl)
    res.redirect(req.query.uplifturl + res.locals.formQuery)
  

  // force skip third cycle
  // } else if (2 == 2){
  //   res.redirect("wait-for-match" + res.locals.formQuery)


  } else { 
  res.render("third-cycle-matching", data);
  }
});


router.get('/wait-for-match', function (req, res) {
  var viewData = {};

  var service = getService(res.locals.requestId);

  viewData.serviceCompleteURL = service.urls.end;

  if (req.query.third_cycle == "false"){
    res.redirect("fail-third-cycle" + res.locals.formQuery)
  } else {

  res.render('wait-for-match', viewData);
}
});

router.get('/uplift-warning', function (req, res) {

  if (req.query.kbvs_done == 'true'){
    console.log('jajajajajaj')
    res.redirect('driving-licence-update-address' + res.locals.formQuery)
  } else {

  res.render('uplift-warning');
  }

});

router.get('/sign-in', function (req, res) {
  var data = {};

  data.idps = idps;

  console.log(data)

  res.render('sign-in', data);
});

// admin (refactor to separate file?)
router.get('/admin', function(req, res){
  var servicesArray = toArray(services);
  servicesArray.sort(function(a,b){
    return (a.name > b.name) ? 1:-1;
  });

  res.render('admin', {'services': servicesArray});
});

router.post('/admin', function(req, res){
  var service = {
    "name": req.body.name,
    "provider": req.body.provider,
    "otherWays": req.body.otherWays,
    "whyVerifysUsed": req.body.whyVerifysUsed,
    "urls": {
      "start" : req.body.startURL,
      "end" : req.body.endURL
    },
    "LOA": req.body.LOA,
    "slug": req.body.slug
  }

  services[req.body.slug] = service;

  var servicesJSON = JSON.stringify(services);

  var postData = { "url": dbURL,
                   "form": { "data": servicesJSON }};

  request.post(postData, function(error, response, body){
    if (!error && response.statusCode == 200) {
      // TO DO confirmation message
      res.redirect('admin');
    } else {
      res.status(500).send(error);
    }
  });

});

router.get('/admin/services/:slug', function(req,res){
  var service = getService(req.params.slug);

  // request types dropdown

  var LOAoptions = [
    {"name": "LOA2",
     "value": "2",
     "selected" : (service.LOA == "2")},
    {"name": "LOA1 with uplift to LOA2",
     "value": "1",
     "selected" : (service.LOA == "1")},
    {"name": "LOA1",
     "value": "0",
     "selected" : (service.LOA == "0")}
    // {"name": "LOA2 (accepts LOA1)",
    //  "value": "2,1",
    //  "selected" : (service.LOA == "2,1")}
  ];

  res.render('admin/service', {"service": service,
                               "isEdit": true,
                               "LOAoptions":LOAoptions});
});

router.get('/admin/add-service', function(req,res){

  var viewData = {};
  var service = getService(res.locals.requestId);

  var LOAoptions = [
    // {"name": "LOA2",
    //  "value": "2",
    //  "selected" : (service.LOA == "2")},
    // {"name": "LOA1 with uplift to LOA2",
    //  "value": "1",
    //  "selected" : (service.LOA == "1")},
    {"name": "LOA1",
     "value": "0",
     "selected" : (service.LOA == "0")}
  ];

  res.render('admin/service', {"isEdit": false,
                               "LOAoptions":LOAoptions});
});


module.exports = router;
