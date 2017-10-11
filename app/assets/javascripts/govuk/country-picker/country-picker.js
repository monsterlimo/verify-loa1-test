function showInput() {
        event.preventDefault()
        country = document.getElementById("country-selector").value;
        console.log(country)

        //List of countries with eIDAs
        eidasCountries = ["Denmark", "Austria", "Belgium", "Spain", "Norway", "Estonia", "Finland", "France", "Germany", "Italy", "Latvia", "Poland", "Sweden", "United Kingdom"]

				if(eidasCountries.indexOf(country)  > -1 ) { 

					document.getElementById('display-hasEidas').innerHTML = country
          document.getElementById('hasEidas').style.display = "block"
          document.getElementById('noEidas').style.display = "none"
				
				} else {
				
					document.getElementById('display-noEidas').innerHTML = country
          document.getElementById('noEidas').style.display = "block"        
          document.getElementById('hasEidas').style.display = "none" 
				
				}
        
    }