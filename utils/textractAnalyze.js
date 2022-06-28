// textAnalyze.js
import fs from 'fs';
// Import required AWS SDK clients and commands for Node.js
import { AnalyzeDocumentCommand } from "@aws-sdk/client-textract";
import { TextractClient } from "@aws-sdk/client-textract";
import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import

// Set the AWS Region.
const REGION = process.env.REGION; //e.g. "us-east-1"
// Create SNS service object.
const textractClient = new TextractClient({ region: REGION });


const get_text = (result, blocksmap) => {
    let text = "";
    if ("Relationships" in result && result.Relationships !== undefined){
        result.Relationships.forEach((relationship) => {
            if (relationship.Type == "CHILD") {
                relationship.Ids.forEach((child_id) => {
                    var word = blocksmap[child_id];
                    if (word.BlockType == "WORD") {
                        text += word.Text + " ";
                    }
                    if (word.BlockType == "SELECTION_ELEMENT") {
                        if (word.SelectionStatus == "SELECTED") {
                            text += 'X ';
                        }
                    }
                    
                });
            }
        });
    }
    return text;
}

const get_rows_columns_map = (table_result, blocksmap) => {
    let rows = {};
    if ("Relationships" in table_result && table_result.Relationships !== 
undefined){
        table_result.Relationships.forEach((relationship) => {
            if (relationship.Type == "CHILD") {
                relationship.Ids.forEach((child_id) => {
                    var cell = blocksmap[child_id];
                    if (cell.BlockType == "CELL") {
                        let row_index = cell.RowIndex;
                        let column_index = cell.ColumnIndex;
                        if (!(row_index in rows)) {
                            rows[row_index] = {};
                        } 
                        rows[row_index][column_index] = get_text(cell, 
blocksmap);
                    }
                });
            }
        });
    }
    return rows;
}


const generate_table_csv = (table_result, blocks_map, table_index) => {
    let csv = "";
    let rows = get_rows_columns_map(table_result, blocks_map);
    let table_id = 'Table_' + table_index;

    // get cells
    csv += `Table: ${table_id}\n\n`;

    for (const [row_index, cols] of Object.entries(rows)) {
        for (const [col_index, text] of Object.entries(cols)) {
            csv += `${text}` + ",";
        }
        csv += "\n";
    }
    csv+= "\n\n\n";
    return csv;
}

const get_table_csv_results = (response) => {
    var blocks = response.Blocks;

    var blocks_map = {};
    var table_blocks = [];
    blocks.forEach((block) => {
        blocks_map[block.Id] = block;
        if (block.BlockType == "TABLE") {
            table_blocks.push(block);
        }
    });

    if (table_blocks.length <= 0) {
        return "<b> NO Table FOUND </b>";
    }

    var csv = "";
    for (const [index, table] of table_blocks.entries()) {
        csv += generate_table_csv(table, blocks_map, index+1);
        csv += "\n\n";
    }

    return csv;
}


export default async function analyze_document_text(params){

	try {
		const analyzeDoc = new AnalyzeDocumentCommand(params);
		const response = await textractClient.send(analyzeDoc);

        var csv = get_table_csv_results(response);
        fs.writeFileSync("output.csv", csv);

		return csv; // For unit tests.
	} catch (err) {
		console.log("Error: ", err);
	}
};
