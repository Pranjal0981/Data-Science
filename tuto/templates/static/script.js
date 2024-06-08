function flattenData(data) {
    let flattenedData = [];

    data.forEach(item => {
        for (const key in item.value) {
            // Skip entries with value 0
            //  if (item.value[key] === 0 || key=="Blank") continue;

            flattenedData.push({
                y: item.key,
                x: key,
                value: item.value[key].count,
                Product: item.value[key].products
            });
        }
    });

    return flattenedData;
}

function update_HeatMap() {


    cf1 = crossfilter(cf.allFiltered());
    customer_dim = cf1.dimension(function (d) {
        return d.Customer;
    }, true);


    const cust_group = customer_dim.group().reduce(
        // Add data to the group
        (p, v) => {
            // Loop through each affect version in the array
            v.New_Version.forEach(version => {
                // Check if issue number exists, affect version is not null, and Calypto Product exists
                if (v.issuenum !== null && version !== null && v.Product) {
                    // Initialize the property if it doesn't exist
                    if (!p[version]) {
                        p[version] = { count: 1, products: [v.Product] };
                    } else {
                        // Increment the value for the affected version
                        p[version].count += 1;
                        // Add the Calypto Product to the list if it's not already there
                        if (!p[version].products.includes(v.Product)) {
                            p[version].products.push(v.Product);
                        }
                    }
                }
            });
            return p;
        },
        // Remove data from the group
        (p, v) => {
            // Loop through each affect version in the array
            v.New_Version.forEach(version => {
                // Check if issue number exists, affect version is not null, and Calypto Product exists
                if (v.issuenum !== null && version !== null && v.Product) {
                    // Decrement the value for the affected version
                    if (p[version]) {
                        p[version].count -= 1;
                        // Remove the Calypto Product from the list if it's no longer present
                        const index = p[version].products.indexOf(v.Product);
                        if (index > -1) {
                            p[version].products.splice(index, 1);
                        }
                    }
                }
            });
            return p;
        },
        // Initialize the object
        () => ({})
    );
    preprocessedData = flattenData(cust_group.all());

    ndx = crossfilter(preprocessedData);
    // var ndx = crossfilter(preprocessedData.toSpliced(50));
    // Define dimensions and groups
    xDim = ndx.dimension(function (d) { return [d.x, d.y] });//customer
    // var yDim = ndx.dimension(function(d) { return d.y; });//affect version
    group1 = xDim.group().reduceSum(function (d) { return d.value; });

    // Calculate the maximum value in your dataset
    var maxValue = d3.max(group1.all(), function (d) {
        return d.value;
    });


    // Create a linear scale from 0 to maxValue
    var colorScale = d3.scaleLinear()
        .domain([1, maxValue])
        .range(["lightcoral", "darkred"]);


    // Create heatmap

    var chart = dc.heatMap("#chart_HeatMap");
    chart
        .width(2500)
        .height(2500)
        .dimension(xDim)
        .group(group1)
        .margins({ top: 10, right: 10, bottom: 100, left: 180 })
        .keyAccessor(function (d) { return d.key[0]; })
        .valueAccessor(function (d) {
            let b = d.key[1];
            let aaa = b.split("?");
            if (aaa.length > 2) {
                // Keep only the first two words
                b = aaa.slice(0, 2).join(" ");
            }
            return b;
        })
        .colorAccessor(function (d) { return d.value; })
        .title(function (d) {
            return "Customer:   " + d.key[1] + "\n" +
                "Affect Version:  " + d.key[0] + "\n" +
                "Issues: " + (d.value);
        })
        .ordinalColors(colorScale)
        .colorCalculator(function (d) {
            // Return a specific color for values of 0
            if (d.value === 0) {
                return "transparent"; // Or any other color you prefer for 0 values
            }
            // Otherwise, use the color scale
            return colorScale(d.value);
        })
    // .renderlet(function(chart) {
    //   // Render x-axis separately
    //   var xAxisNode = d3.select("#chart_HeatMap g.cols.axis").node();
    //   var floatingXAxis = d3.select("#floating-x-axis").node();

    //   while (floatingXAxis.firstChild) {
    //       floatingXAxis.removeChild(floatingXAxis.firstChild);
    //   }

    //   floatingXAxis.appendChild(xAxisNode.cloneNode(true));
    //   floatingXAxis.style.width = chart.width() + 'px';

    //   // Adjust the position of the floating x-axis based on the scroll event
    //    var chartContainer = document.querySelector('.chart-wrapper');
    //    chartContainer.addEventListener('scroll', function() {
    //        document.querySelector('#floating-x-axis').style.top = chartContainer.scrollTop + 'px';
    //    });
    // Render y-axis separately
    // var yAxisNode = d3.select("#chart_HeatMap g.rows.axis").node();
    // var yAxisContainer = d3.select("#y-axis").node();

    // while (yAxisContainer.firstChild) {
    //     yAxisContainer.removeChild(yAxisContainer.firstChild);
    // }

    // yAxisContainer.appendChild(yAxisNode.cloneNode(true));
    // yAxisContainer.style.height = chart.height() + 'px';
    // });



    chart.colOrdering(function (a, b) { return keyOrder.indexOf(a) >= keyOrder.indexOf(b) ? 1 : keyOrder.indexOf(b) > keyOrder.indexOf(a) ? -1 : 0; })

    // Render the heatmap
    chart.render();

    // Adjust floating x-axis position on scroll
    //     var chartContainer = document.querySelector('.chart-wrapper');
    //     chartContainer.addEventListener('scroll', function() {
    //       console.log("In scrolling event")
    //     // var scrollTop = chartContainer.scrollTop;
    //     // var scrollLeft = chartContainer.scrollLeft;
    //     document.querySelector('#floating-x-axis').style.top = chartContainer.scrollTop + 'px';
    //     // document.querySelector('#y-axis').style.top = -scrollTop + 'px';
    // });



    var product_dimension11 = ndx.dimension(function (d) {
        return d.Product;
    }, true);
    select3 = new dc.selectMenu("#select3");
    select3
        .dimension(product_dimension11)
        .group(product_dimension11.group())
        .promptText("Select Product")
        //.controlsUseVisibility(true)
        // .multiple(true)
        .title(function (d) { return d.key })
        // .numberVisible(5)
        .on("filtered", function (d) {
            // update_HeatMap();
        });

    select3.render();
    // update_width();
}

var notOnCurrentReleaseCount;
var dateFormatSpecifier = "%Y-%m-%d";
var dateFormat = d3.timeFormat(dateFormatSpecifier);
var numberFormat = d3.format(".2f");
var dateFormatParser = d3.timeParse(dateFormatSpecifier);

function update_width() {
    dc.chartRegistry.list().forEach(function (d) {
        x = d.anchor().replace("#", "");
        y = document.getElementById(x).offsetWidth;
        d.width(y).transitionDuration(0);
    });
    dc.renderAll();
}


function updateAffectVersion(version) {

    if (version == "CCS_2023.1_1off_Kyocera") {
        return "CCS_2023.1";
    }
    if (version == "2023.2_2") {
        return "2023.2_2";
    }
    // Find the last index of "_" in the version string
    let lastIndex = version.lastIndexOf("_");

    // If "_" exists in the version string
    if (
        lastIndex !== -1 &&
        !isNaN(Number(version[lastIndex + 1])) &&
        !isNaN(Number(version[lastIndex - 1]))
    ) {
        // Split the version string at the last occurrence of "_"
        let updatedVersion = version.substring(0, lastIndex);
        return updatedVersion;
    } else {
        // Return the original version string if no "_" found
        return version;
    }
}

function getReleaseDate(key) {
    if (key == "2023.2" || key == "2023.2_2") {
        return new Date("08-27-2023");
    }
    var temp = data.filter(function (d) {
        if (d.Affect_version.includes(key)) {
            return d;
        }
    });

    if (temp.length > 0) {
        return temp[0].ReleaseDate ? temp[0].ReleaseDate : new Date("2017-01-01");
    } else {
        // Handle the case where ReleaseDate is not immediately available
        // You might want to fetch the ReleaseDate from an asynchronous source
        // or handle it differently based on your use case.
        //   console.error("ReleaseDate not found for key:", key);
        return new Date("2017-01-01");
    }
}

function processData(data1) {
    unchanged_data = data1;
    data = data1.filter(function (d) {
        return (
            d.Project != "CSD Third Party" &&
            d.Project != "DDIS Infrastructure" &&
            d.Project != "DDIS_MKT" &&
            d.type != "QABug" &&
            d.type != "Eval" &&
            d.type != "Support" &&
            d.type != "Epic" &&
            d.type != "Story" &&
            d.type != "Proliferation" &&
            d.type != "Initiative"
        );
    });

    data.forEach(function (d) {
        d.CREATED = d.CREATED.split(" ")[0];
        d.dd = dateFormatParser(d.CREATED);
        d.month = d3.timeMonth(d.dd);

        d.year1 = d3.timeYear(d.dd);
        d.year = d.year1.toDateString().split(" ")[3];

        if (d.type == "CAESupport") {
            d.type = "CAESupport (ACDW)";
        }
        if (!d.ASSIGNEE) {
            d.ASSIGNEE = "Unassigned";
        }

        if (d.Project == "AE CSD & DID Worldwide" && d.Product != null) {
            if (d.Product.includes("PowerPro") || d.Product == "SLEC Pro") {
                d.Project1 = "PowerPro";
            } else if (d.Product.includes("Catapult")) {
                d.Project1 = "Catapult";
            } else if (d.Product == "SLEC System" || d.Product == "SLEC RTL") {
                d.Project1 = "SLEC";
            } else if (d.Product.includes("Precision")) {
                d.Project1 = "Precision Synthesis";
            } else {
                d.Project1 = "Blank";
            }
        } else {
            d.Project1 = d.Project;
        }

        if (
            d.Customer ==
            "AMD?RESEARCH?&?DEVELOPMENT?CENTER?INDIA?PRIVATE?LIMITED"
        ) {
            d.Customer = "AMD R&D CENTER INDIA";
        }

        if (d.Customer == null) {
            d.Customer = "Blank";
            //d.geography="Blank";
        }
        if (d.Customer != null) {
            d.Customer = d.Customer.toUpperCase();
            d.Customer = d.Customer.split(":");
            // d.geography=find_geography(d);
        }
        if (d.Customer != null) ///////////first 2 words of each customer
        {
            d.Customer = d.Customer.map(customerName => {
                // Split the customer name by spaces and keep only the first two words
                const words = customerName.split(" ");
                return words.slice(0, 2).join(" ");
            });
        }

        if (d.Priority == null) {
            d.Priority = "Blank";
        }
        if (d.Affect_version == null) {
            d.Affect_version = "Blank";
            d.ReleaseDate = "2016-01-01";
        }
        if (d.Affect_version != null) {
            d.Affect_version = d.Affect_version.split(",");
        }
        if (d.Affect_version == "2023.2_2") {
            d.Affect_version == "2023.2";
        }
        if (d.Affect_version == "PowerPro-2023.1_3") {
            d.ReleaseDate = "2023-09-15";
        }
        if (d.Affect_version == "PowerPro-2023.2_1") {
            d.ReleaseDate = "2023-10-05";
        }
        if (d.Affect_version != null) {

            d.New_Version = d.Affect_version.map((version) => {
                return updateAffectVersion(version);
            });

        }

        if (d.ReleaseDate == null) {
            d.ReleaseDate = "2017-01-02";
            d.ReleaseDate = dateFormatParser(d.ReleaseDate);
        } else {
            d.ReleaseDate = d.ReleaseDate.split(" ")[0];
            d.ReleaseDate = dateFormatParser(d.ReleaseDate);
        }
        if (d.Labels == null) {
            d.Labels = "Blank";
        }
        if (d.Labels != null) {
            d.Labels = d.Labels.toUpperCase();
            d.Labels = d.Labels.split(",");
        }
    });

    //   unchanged_data.forEach(function(d) {
    //     d.Customer.forEach(function(v, i) {
    //         let aaa = v.split("?");
    //         if (aaa.length > 2) {
    //             // Keep only the first two words
    //             d.Customer[i] = aaa.slice(0, 2).join(" ");
    //         }
    //     });
    // });

    cf = crossfilter(data);

    // customer_dim= cf.dimension(function(d){return d.Customer;},true);



    // update_HeatMap();

    // update_width();


    FixDimension = cf.dimension(function (d) { return d.Affect_version }, true)
    rawData = FixDimension.group().all();
    // Create a set of keys in the original order

    rawData.sort(function (a, b) {
        var releaseDateA = getReleaseDate(a.key) || new Date("12-31-2017");
        var releaseDateB = getReleaseDate(b.key) || new Date("12-31-2017");

        //   console.log("Release Date A:", releaseDateA, "Release Date B:", releaseDateB);
        //   console.log("Key Order Index A:", keyOrder.indexOf(a.key), "Key Order Index B:", keyOrder.indexOf(b.key));

        // Use d3.ascending for ascending order or d3.descending for descending order
        return d3.descending(releaseDateA, releaseDateB);
    });

    keyOrder = rawData.map(function (item) {
        return item.key;
    });


    update_HeatMap();

}

$(document).ready(function () {
    //

    function showLoadingOverlay() {
        $("#loading-overlay").show();
    }

    // Function to hide loading overlay
    function hideLoadingOverlay() {
        $("#loading-overlay").hide();
    }
    // $.getJSON("/customers/customer_summary",function(data1)
    // {
    if (window.cachedData && window.cachedData.length > 0) {
        var new_data1 = JSON.parse(JSON.stringify(window.cachedData));
        // Proceed with processing window.flaskData
        console.log("using cache data");
        processData(new_data1);

        console.log("in cache function");
        hideLoadingOverlay();
    } else {
        $.ajax({
            url: "/customers/customer_summary_acdw",
            type: "GET",
            beforeSend: function () {
                showLoadingOverlay();
            },
            success: function (data1) {
                // Handle the data
                if (!data1.length) {
                    alert("NO Data found, Please check server configuration");
                } else {
                    window.cachedData = JSON.parse(JSON.stringify(data1));
                    console.log("in ajax api");
                    processData(data1);

                }
            },
            complete: function () {
                hideLoadingOverlay();
            },
        });
    }
    // })
});