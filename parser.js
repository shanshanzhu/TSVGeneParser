var fs = require('fs');
var csv = require('fast-csv')

var INPUT_FILE_PATH = 'CosmicFusionExport.tsv';
var OUTPUT_FILE_PATH = 'CosmicFusionExport_output.tsv';
var FUSION_TYPE_INDEX
var PATTERNS = ['{ENST', '{NM_']
// @name "CCDC6{ENST00000263102}:r.1_535_RET{ENST00000355710}:r.2369_5659"
// return ['CCDC6', 'RET']
var getTwoGeneNames = function (name, pattern) {
  var firstStartIdx = 0
  var firstEndIdx = name.indexOf(pattern)
  if (firstEndIdx === -1) return null
  var first = name.substring(firstStartIdx, firstEndIdx)
  var temp = name.replace(pattern, '')
  var secondEndIdx = temp.indexOf(pattern)
  var secondStartIdx = 0
  for (var i = secondEndIdx; i > 0; i --) {
    if (temp[i] === '_') {
      secondStartIdx = i + 1
      break;
    }
  }
  var second = temp.substring(secondStartIdx, secondEndIdx)
  return [first, second]
}
var transformLine = function(line) {
  var idx = line.indexOf('Translocation Name')
  var total = line.length

  FUSION_TYPE_INDEX = FUSION_TYPE_INDEX || idx
  var isHeader = idx !== -1
  var toAdd = null
  if (isHeader) {
    toAdd = [
      'Translocation Name 1st Gene',
      'Translocation Name 2nd Gene'
    ]
  } else {
    var gene = line[FUSION_TYPE_INDEX] || ''
    if (gene) {
      for (var i = 0; i < PATTERNS.length; i ++) {
        var pattern = PATTERNS[i]
        toAdd = getTwoGeneNames(gene, pattern)
        if (toAdd) break
      }
    }
  }
  toAdd = toAdd || ['', '']
  var nextLine = line.slice(0, FUSION_TYPE_INDEX + 1)
    .concat(toAdd)
    .concat(
      line.slice(FUSION_TYPE_INDEX + 1, total)
    )

  return nextLine
}
// var parser = csv.parse({delimiter: '\t'})
//   .on('data', function(data) {
//     splitLine(data)
//   })
//   .on('end', function() {
//     console.log('read end')
//   })
csv
   .fromPath(INPUT_FILE_PATH, {delimiter: '\t'})
   .transform(transformLine)
   .pipe(csv.createWriteStream({headers: true}))
   .pipe(fs.createWriteStream(OUTPUT_FILE_PATH, {encoding: "utf8"}));

// fs.createReadStream(inputFile)
//   .pipe(parser)
  // .pipe(reader);