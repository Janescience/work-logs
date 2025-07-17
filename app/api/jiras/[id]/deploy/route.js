import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Jira from '@/models/jira.model';
import User from '@/models/user.model';
import Service from '@/models/service.model';
import DailyLog from '@/models/dailyLog.model';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, CheckBox, BorderStyle, ShadingType, VerticalAlign } from 'docx';
import JSZip from 'jszip';
import mongoose from 'mongoose';

// --- Helper Functions for DOCX generation ---
const FONT_SIZE = 22; // 11pt

// Main API Function
export async function POST(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: jiraId } = params;
        const deployData = await req.json();

        // 1. Fetch all necessary data
        const jira = await Jira.findById(jiraId).populate('dailyLogs').lean();
        if (!jira) return NextResponse.json({ error: 'Jira not found' }, { status: 404 });
        
        const [user, service] = await Promise.all([
            User.findById(session.user.id).lean(),
            Service.findOne({ name: jira.serviceName }).lean()
        ]);
        
        if (!user || !service) {
            return NextResponse.json({ error: 'User or Service data not found' }, { status: 404 });
        }

        const serviceDetails = await mongoose.connection.db.collection('servicedetails').find({ service: service._id }).toArray();
        const team = await mongoose.connection.db.collection('teams').findOne({ memberIds: { $in: [user._id.toString()] } });
        const currentEnvDetail = serviceDetails.find(d => d.env === deployData.environment) || {};
        const hasSql = jira.dailyLogs?.some(log => log.sqlDetail && log.sqlDetail.trim() !== '');

        // --- 2. Generate DOCX Document ---
        const doc = generateDocx(jira, user, team, deployData, hasSql, currentEnvDetail);

        const docBuffer = await Packer.toBuffer(doc);
        const zip = new JSZip();
        zip.file(`Request Deployment ${deployData.environment} - ${jira.serviceName}.docx`, docBuffer);

        const sqlScripts = jira.dailyLogs?.map(log => log.sqlDetail).filter(Boolean).join('\n\n-- --------------------------\n\n');
        if (sqlScripts) {
            zip.file('SQL Script.sql', sqlScripts);
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        const filename = `Deployment_Package_${jira.jiraNumber}.zip`;
        
        return new NextResponse(zipBuffer, {
            status: 200,
            headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${filename}"` },
        });

    } catch (error) {
        console.error("Deployment process failed:", error);
        return NextResponse.json({ error: `Deployment failed: ${error.message}` }, { status: 500 });
    }
}

// *** THIS IS THE FIXED MAIN DOCUMENT GENERATION FUNCTION ***
function generateDocx(jira, user, team, deployData, hasSql, currentEnvDetail) {
    const FONT_SIZE = 22; // 11pt
    
    // Helper functions
    const createP = (text = '', options = {}) => new Paragraph({ 
        children: [new TextRun({ text, size: FONT_SIZE, ...options })] 
    });
    
    const noBorders = { 
        top: { style: BorderStyle.NONE }, 
        bottom: { style: BorderStyle.NONE }, 
        left: { style: BorderStyle.NONE }, 
        right: { style: BorderStyle.NONE } 
    };
    
    const allBorders = { 
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, 
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, 
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, 
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } 
    };
    
    const createCheckbox = (checked, text) => new Paragraph({ 
        children: [ 
            new CheckBox({ checked, size: 24 }), 
            new TextRun({ text: `  ${text}`, size: FONT_SIZE }) 
        ] 
    });
    
    const dataCell = (children, options = {}) => new TableCell({
        children: Array.isArray(children) ? children : [createP(children)],
        verticalAlign: VerticalAlign.CENTER,
        borders: allBorders,
        ...options
    });
    
    // Create header table with proper structure
     const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [createP('Request Deployment Application', { bold: true, size: 28 })],
                        borders: allBorders,
                        rowSpan: 4
                    }),
                    new TableCell({
                        children: [createP('Jira ID :', { bold: true })],
                        borders: allBorders
                    }),
                    new TableCell({
                        children: [createP(jira.jiraNumber, { bold: true })],
                        borders: allBorders
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [createP('Requested Date :')],
                        borders: allBorders
                    }),
                    new TableCell({
                        children: [createP(new Date().toLocaleDateString('en-CA'))],
                        borders: allBorders
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [createP('Deployed Date :')],
                        borders: allBorders
                    }),
                    new TableCell({
                        children: [createP(new Date(deployData.deployDate).toLocaleDateString('en-CA'))],
                        borders: allBorders
                    })
                ]
            }),
            new TableRow({
                children: [
                    new TableCell({
                        children: [createP('Expected Date :')],
                        borders: allBorders
                    }),
                    new TableCell({
                        children: [createP(new Date(deployData.deployDate).toLocaleDateString('en-CA'))],
                        borders: allBorders
                    })
                ]
            })
        ],
        columnWidths: [4800, 2400, 2400]
    });
    
    // Create section header function
    const createSectionHeader = (text) => new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [createP(text, { bold: true, color: "FFFFFF" })],
                        shading: { fill: "C00000", type: ShadingType.CLEAR },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: allBorders
                    })
                ]
            })
        ],
        columnWidths: [9600]
    });
    
    // Part 1 table
    const part1Table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ 
                children: [ 
                    dataCell('Name - Surname'), 
                    dataCell(user.name), 
                    dataCell('Phone'), 
                    dataCell(user.phone || '') 
                ] 
            }),
            new TableRow({ 
                children: [ 
                    dataCell('Position'), 
                    dataCell('Developer'), 
                    dataCell('Email'), 
                    dataCell(user.email) 
                ] 
            }),
            new TableRow({ 
                children: [ 
                    dataCell('Department'), 
                    dataCell(team?.teamName || 'IT Solution Delivery'), 
                    dataCell(''), 
                    dataCell('') 
                ] 
            }),
            new TableRow({ 
                children: [ 
                    dataCell('Project'), 
                    dataCell(`${jira.jiraNumber} ${jira.description}`, { columnSpan: 3 }) 
                ] 
            }),
        ],
        columnWidths: [2400, 2400, 2400, 2400]
    });
    
    // Part 2 table
    const part2Table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [createCheckbox(jira.dailyLogs?.length > 0, 'Deployment')],
                        borders: allBorders
                    }),
                    new TableCell({
                        children: [createCheckbox(hasSql, 'Data Patch/ Data Script')],
                        borders: allBorders
                    })
                ]
            })
        ],
        columnWidths: [4800, 4800]
    });
    
    // Get deployment steps
    const envDetailsText = jira.dailyLogs?.map(log => log.envDetail).filter(Boolean).join('\n');
    const referFolder = `T:\\Projects\\Deployment\\${jira.jiraNumber}\\Non-AS400\\${new Date(deployData.deployDate).getFullYear()}${(new Date(deployData.deployDate).getMonth() + 1).toString().padStart(2, '0')}\\${jira.jiraNumber} ${jira.description}\\${jira.serviceName}`;
    
    let deploymentSteps = [createP(`Refer folder : ${referFolder}`)];
    
    if (deployData.platform === 'Docker') {
        const serverIP = currentEnvDetail.server || 'N/A';
        deploymentSteps.push(createP('Remote to server',{ bold: true}));
        deploymentSteps.push(createP(`IP : ${serverIP}`));
        deploymentSteps.push(createP('Edit docker-compose.yml file',{ bold: true}));
        deploymentSteps.push(createP(`image : 172.16.64.13:5000/${jira.serviceName}:${deployData.imageVersion}`, { indent: { left: 1200 } }));
        
        if(envDetailsText){
            deploymentSteps.push(createP('Edit .env file',{ bold: true}));
            deploymentSteps.push(createP(envDetailsText, {font: 'Courier New'}));
        }
        
        deploymentSteps.push(createP('Run command docker login',{ bold: true}));
        deploymentSteps.push(createP('sudo docker login 172.16.64.13:5000 --username bo-nl-dev01', { indent: { left: 400 } }));
        deploymentSteps.push(createP('Run command start docker',{ bold: true}));
        deploymentSteps.push(createP('sudo docker-compose up -d', { indent: { left: 400 } }));
    }
    
    // Create deployment table
    const deploymentTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: deploymentSteps,
                        borders: allBorders
                    })
                ]
            })
        ],
        columnWidths: [9600]
    });
    
    // Create rollback table
    const rollbackTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [createP(`Refer folder : ${referFolder}`)],
                        borders: allBorders
                    })
                ]
            })
        ],
        columnWidths: [9600]
    });
    
    // Build document sections
    const docChildren = [
        headerTable,
        createP(),
        createSectionHeader('Part 1 (Requestor) :'),
        part1Table,
        createP(),
        createSectionHeader('Part 2 (Request Type) :'),
        part2Table,
        createP(),
        createSectionHeader('Part 3 (Deployment Platform) :'),
        getPlatformTable(deployData),
        createP(),
    ];
    
    // Add Data Patch section if needed
    if (hasSql) {
        const dataPatchTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        dataCell(`Host Name/ IP: ${currentEnvDetail.database1 || ''}`, { columnSpan: 3 }),
                    ]
                }),
                new TableRow({
                    children: [
                        dataCell(`Database Name: ${deployData.dbName}`),
                        dataCell(`Schema: ${deployData.dbSchema}`,{ columnSpan: 3 })
                    ]
                }),
                new TableRow({
                    children: [
                        dataCell([
                            createP('Step :'),
                            createP(`1. Backup Database (${deployData.dbSystem})`),
                            createP('2. Run "SQL Script.sql"')
                        ], { columnSpan: 3 })
                    ]
                })
            ],
            columnWidths: [3200, 3200, 3200]
        });
        
        docChildren.push(
            createSectionHeader('Part 4 (Data Patch/ Data Script Description) :'),
            dataPatchTable,
            createP()
        );
    }
    

    
    docChildren.push(
        createP(),
        createSectionHeader('Part 5 (Deployment Steps) :'),
        deploymentTable,
        createP(),
        createSectionHeader('Part 6 (Rollback Steps) :'),
        rollbackTable
    );
    
    return new Document({ 
        sections: [{ 
            children: docChildren,
            properties: {
                page: {
                    margin: {
                        top: 720,    // 0.5 inch
                        right: 720,  // 0.5 inch
                        bottom: 720, // 0.5 inch
                        left: 720    // 0.5 inch
                    }
                }
            }
        }] 
    });
}

function getPlatformTable(deployData) {
    const { platform, dbSystem, language } = deployData;
    
    const allBorders = { 
        top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, 
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, 
        left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, 
        right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } 
    };
        
    const createP = (text = '', options = {}) => new Paragraph({ 
        children: [new TextRun({ text, size: 22, ...options })] 
    });
    
    const createCheckbox = (checked, text) => new Paragraph({ 
        children: [ 
            new CheckBox({ checked, size: 24 }), 
            new TextRun({ text: `  ${text}`, size: 22 }) 
        ] 
    });

    const labelCell = (text) => new TableCell({ 
        children: [createP(text, {bold: true})], 
        borders: allBorders, 
        verticalAlign: VerticalAlign.CENTER
    });
    
    const checkboxCell = (children) => new TableCell({ 
        children: children, 
        borders: allBorders, 
        verticalAlign: VerticalAlign.CENTER
    });

    return new Table({ 
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({ 
                children: [ 
                    labelCell('Operating System'), 
                    checkboxCell([
                        createCheckbox(platform === 'Windows Server', 'Windows System'),
                        createCheckbox(platform === 'Docker', 'Unix System')
                    ])
                ] 
            }),
            new TableRow({ 
                children: [ 
                    labelCell('Cloud System'), 
                    checkboxCell([
                        createCheckbox(platform === 'AWS ECS', 'AWS'),
                        createP('☐ Azure'),
                        createP('☐ Google Cloud')
                    ])
                ] 
            }),
            new TableRow({ 
                children: [ 
                    labelCell('Middleware System'), 
                    checkboxCell([
                        createCheckbox(platform === 'Windows Server', 'Tomcat'),
                        createCheckbox(platform === 'Docker', 'Other Specify: Docker')
                    ])
                ] 
            }),
            new TableRow({ 
                children: [ 
                    labelCell('Database System'), 
                    checkboxCell([
                        createCheckbox(dbSystem === 'MySQL', 'MySQL'),
                        createCheckbox(dbSystem === 'PostgreSQL', 'PostgreSQL'),
                        createCheckbox(dbSystem === 'MS-SQL Server', 'MS-SQL Server')
                    ])
                ] 
            }),
            new TableRow({ 
                children: [ 
                    labelCell('Development Language'), 
                    checkboxCell([
                        createCheckbox(language === 'JAVA', 'JAVA'),
                        createCheckbox(language === '.NET', '.NET'),
                        createCheckbox(language === 'PHP', 'PHP')
                    ])
                ] 
            })
        ],
        columnWidths: [3200, 6400]
    });
}