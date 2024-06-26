const element = document.getElementById("key_test_button");
element.addEventListener("click", myFunction);

function myFunction() {
  const api_key = document.querySelector("#api_key").value;
  const testUrl =
    "https://api.nearmap.com/coverage/v2/point/-90.1534099,34.9662661?apikey=" +
    api_key +
    "&limit=1&offset=0&sort=captureDate";
  console.log(api_key);
  console.log(testUrl);

  var myRequest = new Request(testUrl);
  fetch(myRequest).then(function (response) {
    console.log(response.status); // returns status

    if (response.status == 200) {
      alert("API Key Good, Please continue");
      //  block of code to be executed if the condition is true
    } else {
      alert("API KEY SUBMISSION BAD, Please Confirm");
      //  block of code to be executed if the condition is false
    }
  });
}

// Function to convert JSON output to GeoJSON format
function convertToGeoJSON(jsonOutput) {
  if (!jsonOutput || !jsonOutput.features) {
    console.error("Invalid JSON output. Missing features property.");
    return null;
  }

  console.log('the processing shoudl be running now')

  return {
    "type": "FeatureCollection",
    "features": jsonOutput.features.map(feature => ({
      "type": "Feature",
      "properties": {
        "id": feature.id,
        "classId": feature.classId,
        "description": feature.description,
        "confidence": feature.confidence,
        // Add more properties as needed...
      },
      "geometry": {
        "type": feature.geometry.type,
        "coordinates": feature.geometry.coordinates
      }
    }))
  };
}

//coveage check for 400 error, (bad request) or 404 error (survey not found), or 200 (good).
function coverageChecker(token_request_url) {
  console.log(token_request_url);

  var myRequest = new Request(token_request_url);
  fetch(myRequest).then(function (response) {
    console.log(response.status); // returns status

    if (response.status == 200) {
      console.log("Good Response");
    } else if (response.status == 404) {
      alert("Error 404 - Coverage Not Found for this Address");
    } else if (response.status == 400) {
      alert("Error 400 - Bad Parameters, Please Check Address");
    } else if (response.status == 401) {
      alert("Error 401 - Bad Input Parameters, Probably API Key Issue");
    }
  });
}

const download = document.getElementById("download_button");
download.addEventListener("click", token_req_fun);

function token_req_fun() {
  var report_type;
  var ele = document.getElementsByName("listGroupRadioGrid");
  console.log(ele);

  for (let i = 0; i < ele.length; i++) {
    if (ele[i].checked) report_type = ele[i].value;
  }

  var api_key = document.querySelector("#api_key").value;
  var country = document.querySelector("#coutrycode").value;
  var address = document.querySelector("#address").value.replace(/\s/g, "%20");
  var city = document.querySelector("#city").value;
  var state = document.querySelector("#state").value;
  var zip = document.querySelector("#zip").value;
  var full_address = address + "%2C%20" + city + "%2C%20" + state + "%20" + zip;
  var format = document.querySelector("#format").value;
  var country = document.querySelector("#coutrycode").value;
  var resource_type = document.querySelector("#resource_type").value;

  var payload;
  var token;
  var bbox;
  var survey_id;
  var download_url;
  var aiResourceId;


  var token_request_url =
    "https://api.nearmap.com/coverage/v2/tx/address?address=" +
    full_address +
    "&country=" +
    country +
    "&streetAddress=" +
    address +
    "&city=" +
    city +
    "&postcode=" +
    zip +
    "&state=" +
    state +
    "&dates=all" +
    "&resources=" +
    resource_type +
    report_type +
    "&limit=200&offset=0&apikey=" +
    api_key;

  console.log(`api key is ${api_key}`);
  console.log(`request url is ${token_request_url}`);
  console.log(`report type is ${report_type}`);
  console.log(`report type is ${resource_type}`);
  coverageChecker(token_request_url); //checks for 400 error, (bad request) or 404 error (survey not found), or 200 (good).

  //set the payload for the token request
  fetch(token_request_url)
    .then((res) => res.json())
    .then((data) => {
      payload = data;
      token = data.transactionToken;
      survey_id = data.surveys[0].id;
      aiResourceId = data.surveys[0].aiResourceId;
      bbox = data.bbox.replace(/,/g, "%2C");
      console.log(`token is ${token}`);
      console.log(`survey id is ${survey_id}`);
      console.log(`aiResource id is ${aiResourceId}`);
      console.log(`report_type is ${report_type}`);
      console.log(`bbox is ${bbox}`);
      console.log(`format is ${format}`);

      var download_url;

      if (resource_type === "raster%3A") {
        download_url = `https://api.nearmap.com/staticmap/v3/surveys/${survey_id}/${report_type}.${format}?bbox=${bbox}&transactionToken=${token}`;
      } else {
        download_url = `https://api.nearmap.com/ai/features/v4/tx/surveyresources/${aiResourceId}/features.${format}?transactionToken=${token}`;
      }

      console.log(`download_URL is ${download_url}`);
      fetch(download_url)
        .then(resp => resp.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
      
          // Download the file
          var formatted_file_name = full_address.replace(/%20/g, "_");
          formatted_file_name = formatted_file_name.replace(/%2C/g, "_");
          a.download = `${report_type}_${formatted_file_name}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
      
          // Convert JSON output to GeoJSON
          blob.text().then(text => {
            const geoJson = convertToGeoJSON(JSON.parse(text));
            const geoJsonString = JSON.stringify(geoJson, null, 2);
            
            // Create a Blob object from the GeoJSON string
            const geoJsonBlob = new Blob([geoJsonString], { type: 'application/json' });
            
            // Create a URL for the Blob object
            const geoJsonUrl = window.URL.createObjectURL(geoJsonBlob);
            
            // Create a new anchor element for downloading the GeoJSON file
            const geoJsonLink = document.createElement('a');
            geoJsonLink.style.display = 'none';
            geoJsonLink.href = geoJsonUrl;
            geoJsonLink.download = `${report_type}_${formatted_file_name}.geojson`;
            
            // Append the anchor element to the document body and trigger the click event to initiate download
            document.body.appendChild(geoJsonLink);
            geoJsonLink.click();
            
            // Cleanup by revoking the URL object
            window.URL.revokeObjectURL(geoJsonUrl);
          });
        })
        .catch(() => alert('oh no!'));
      
     
    })

    // console logs for testing
    .then(() => {
      console.log(payload);
      console.log(`token is ${token}`);
      console.log(`survey_id is ${survey_id}`);
      console.log(`download_url is ${download_url}`);
    });
}

const handleSubmit = (event) => {
  event.preventDefault();

  const myForm = event.target;
  const formData = new FormData(myForm);

  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString(),
  })
    .then(() => console.log("Form successfully submitted"))
    .catch((error) => alert(error));
};

document.querySelector("form").addEventListener("submit", handleSubmit);
