const firebaseConfig = {
    apiKey: "AIzaSyC0smQ311k3ZcmEQp6DYzuD5kLfZ8gE--I",
    authDomain: "test-45d5d.firebaseapp.com",
    databaseURL: "https://test-45d5d-default-rtdb.firebaseio.com",
    projectId: "test-45d5d",
    storageBucket: "test-45d5d.appspot.com",
    messagingSenderId: "802753225677",
    appId: "1:802753225677:web:00e5ac17703eea8453da84",
    measurementId: "G-TYVQ4XWGBV"
  };


firebase.initializeApp(firebaseConfig);
firebase.analytics();

function onButtonToggleClick(id) {
    var button = document.getElementById(id);
    var isReserved = button.innerText === "Rezervisano / Otkaži";

    if (isReserved) {
        // Otkazivanje rezervacije
        var parkingRef = firebase.database().ref("rezervacije/" + id);
        parkingRef.update({ rezervisano: false, kod: null }, function (error) {
            if (error) {
                alert("Došlo je do greške prilikom otkazivanja rezervacije.");
            } else {
                alert("Uspješno ste otkazali rezervaciju!");
                button.style.backgroundColor = "transparent"; // Vraćamo boju na prvobitnu
                button.style.border = "2px solid white";
              
                button.innerText = "Rezerviši"; // Vraćamo tekst na "Rezerviši"

                // Povećavanje broja slobodnih mjesta
                var brojSlobodnihMjestaRef = firebase.database().ref("brojSlobodnih");
                brojSlobodnihMjestaRef.transaction(function (currentValue) {
                    return (currentValue || 0) + 1; // Povećavamo broj slobodnih mjesta za 1
                }, function (error, committed, snapshot) {
                    if (error) {
                        alert("Došlo je do greške prilikom ažuriranja broja slobodnih mjesta.");
                    }
                });

            }
        });
    } else {
        // Rezervacija mjesta
        var brojSlobodnihMjestaRef = firebase.database().ref("brojSlobodnih");

        brojSlobodnihMjestaRef.once("value", function (snapshot) {
            var brojSlobodnihMjesta = snapshot.val();

            if (brojSlobodnihMjesta > 0) {
                var parkingRef = firebase.database().ref("rezervacije/" + id);
                var code = generateRandomCode(); // Generisanje 4-znamenkastog koda
                console.log(code);
                parkingRef.update({ rezervisano: true, kod: code }, function (error) {
                    if (error) {
                        alert("Došlo je do greške prilikom rezervacije.");
                    } else {
                        alert("Uspješno ste rezervisali mjesto!");
                        button.style.backgroundColor = "blue";
                        button.innerText = "Rezervisano / Otkaži";

                        // Smanjivanje broja slobodnih mjesta
                        brojSlobodnihMjestaRef.transaction(function (currentValue) {
                            return (currentValue || 0) - 1; // Smanjujemo broj slobodnih mjesta za 1
                        }, function (error, committed, snapshot) {
                            if (error) {
                                alert("Došlo je do greške prilikom ažuriranja broja slobodnih mjesta.");
                            }
                        });
                    }
                });
            } else {
                alert("Nema slobodnih mjesta.");
            }
        });
    }
}



function rampa(id) {
    var parkingMjestoRef = firebase.database().ref("rezervacije/" + id + "/rezervisano");
  
    parkingMjestoRef.once("value", function(snapshot) {
      var rezervisano = snapshot.val();
  
      if (rezervisano) {

        console.log("Sad se treba dodati input");
        var inputDiv = document.getElementById("inputDiv" + id.substr(-1));
        inputDiv.style.display = "block";

        var kodInput = document.getElementById("kodInput" + id.substr(-1));
        kodInput.value = "";

        var myButton = document.getElementById("potvrdiButton" + id.substr(-1));
        myButton.style.display = "block";
  
      } else {
        alert("Ne možete podići rampu, parking nije rezervisan.");
      }
    });
  }

  var mahanjeBtn = document.getElementById('mahanjeBtn');

  // Dodavanje event listener-a na dugme
  mahanjeBtn.addEventListener('click', function() {
    // Postavljanje vrijednosti u Firebase bazi podataka na 'true'
    firebase.database().ref('mahanje').set(1).then(function() {
      console.log('proslo');
    }).catch(function(error) {
      console.error('greska', error);
    });
  });
  
  function proveriKod(id) {
    var kodInput = document.getElementById("kodInput" + id).value;
    
    console.log(kodInput);
    console.log(id);
    
    var kodRef = firebase.database().ref("rezervacije/parkingMjesto" + id + "/kod");

    kodRef.once("value", function(snapshot) {
        var praviKod = snapshot.val();

        if (praviKod == kodInput) {
            alert("Kod je ispravan. Podižemo rampu.");


            var inputDiv = document.getElementById("inputDiv" + id);
            inputDiv.style.display = "none";

            var potvrdiButton = document.getElementById("potvrdiButton" + id);
            potvrdiButton.style.display = "none";

            var myButton = document.getElementById("parkingMjesto" + id);
            myButton.style.backgroundColor = "#000000";
            myButton.style.border = "2px solid red";


            var rampaRef = firebase.database().ref("rampa");
            rampaRef.set(1);
        } else {
            alert("Pogrešan kod. Ne možemo podići rampu.");
        }
    });
  }

var vrijemeUlaska; 

function getVrijemeUlaska() {
    firebase.database().ref("vrijemeUlaska").once("value", function(snapshot) {
        vrijemeUlaska = snapshot.val();
        console.log("Vrijeme ulaska: " + vrijemeUlaska);
    });
}

// Dohvati vrijeme izlaska iz baze
function getVrijemeIzlaska() {
    firebase.database().ref("vrijemeIzlaska").once("value", function(snapshot) {
        var vrijemeIzlaska = snapshot.val();
        console.log("Vrijeme izlaska: " + vrijemeIzlaska);

        // Izračunaj cijenu
        var cijena = izracunajCijenu(vrijemeUlaska, vrijemeIzlaska);
        console.log("Cijena: " + cijena);

        updateVrijemeUlaskaIzlaska(vrijemeUlaska, vrijemeIzlaska, cijena);
    });


}

function izracunajCijenu(vrijemeUlaska, vrijemeIzlaska) {
    // Razdvoji sate i minute
    var ulazSplit = vrijemeUlaska.split(":");
    var izlazSplit = vrijemeIzlaska.split(":");

    // Pretvori u minute
    var ulazMinute = parseInt(ulazSplit[0]) * 60 + parseInt(ulazSplit[1]);
    var izlazMinute = parseInt(izlazSplit[0]) * 60 + parseInt(izlazSplit[1]);

    // Izračunaj razliku u minutama
    var razlika = Math.abs(izlazMinute - ulazMinute);

    // Cijena po satu
    var cijenaPoSatu = 2; // Postavi svoju cijenu po satu

    // Izračunaj cijenu
    var cijena = Math.ceil(razlika / 60) * cijenaPoSatu; // Pretvori u sate i izračunaj cijenu

    return cijena; // Vrati izračunatu cijenu u formatu "X KM"
}


function updateVrijemeUlaskaIzlaska(vrijemeUlaska, vrijemeIzlaska, cijena) {
    var element = document.getElementById("vrijemeUlaskaIzlaska");
    element.innerText = "Vrijeme ulaska: " + vrijemeUlaska + " | Vrijeme izlaska: " + vrijemeIzlaska + " | Cijena: " + cijena + " KM";
}


document.addEventListener("DOMContentLoaded", function() {
    getVrijemeUlaska();
    getVrijemeIzlaska();
});


function generateRandomCode() {
    return Math.floor(1000 + Math.random() * 9000); // Generisanje slučajnog broja između 1000 i 9999
}

function prikaziInput(id) {
    var inputDiv = document.getElementById("inputDiv" + id.substring(12)); // Izdvajamo broj iz ID-a parkingMjesto1
    inputDiv.style.display = "block";
}



