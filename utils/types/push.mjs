import { createClient } from '@remkoj/optimizely-cms-api';
import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to a usable file path
const currentFilename = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilename);
const directoryToFindTypesIn = fg.convertPathToPattern(path.resolve(
    `${currentDirectory}/../../src/cms`
)); // looking for pattern *.opti-type.json

// Environment variables for API connection
const clientId = process.env.OPTIMIZELY_CLIENT_ID;
const clientSecret = process.env.OPTIMIZELY_CLIENT_SECRET;
const cmsUrl = process.env.OPTIMIZELY_CMS_URL;

// Create an instance of the client
const config = {
    base: new URL(cmsUrl),
    clientId: clientId,
    clientSecret: clientSecret,
};
const client = createClient(config);

/**
 * Find all files matching a pattern in the specified directory
 * @param {string} pattern - The file pattern to look for
 * @returns {Promise<string[]>} - Array of file paths
 */
async function processFiles(pattern) {
    try {
        const files = await fg(`${directoryToFindTypesIn}/**/${pattern}`, {
            absolute: true,
        });
        return files;
    } catch (error) {
        console.error('Error finding files:', error);
        return [];
    }
}

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<object|undefined>} - Parsed JSON or undefined on error
 */
async function tryReadJsonFile(filePath) {
    try {
        return JSON.parse(await fs.readFile(filePath, { encoding: 'utf-8' }));
    } catch (e) {
        console.log(`Error while reading ${filePath}`);
        console.log(`Error Details: ${e.message}`);
    }
    return undefined;
}

/**
 * Get all property groups from the CMS
 * @returns {Promise<object>} - Object with group keys as properties
 */
async function getPropertyGroups() {
    try {
        const groups = await client.propertyGroups.propertyGroupsList();
        const groupMap = {};
        if (groups && groups.items) {
            groups.items.forEach(group => {
                groupMap[group.key] = group;
            });
        }
        return groupMap;
    } catch (error) {
        console.error('Error fetching property groups:', error);
        return {};
    }
}

/**
 * Create a property group if it doesn't exist
 * @param {string} groupKey - The key of the group to create
 * @returns {Promise<boolean>} - True if created successfully
 */
async function createPropertyGroup(groupKey) {
    try {
        await client.propertyGroups.propertyGroupsCreate({
            key: groupKey,
            displayName: groupKey,
            sortOrder: 0
        });
        console.log(`✅ Created property group: ${groupKey}`);
        return true;
    } catch (error) {
        console.error(`❌ Error creating property group ${groupKey}:`, error.message);
        return false;
    }
}

/**
 * Ensure all property groups exist for a content type
 * @param {object} contentType - The content type definition
 * @param {object} existingGroups - Map of existing property groups
 */
async function ensurePropertyGroups(contentType, existingGroups) {
    if (!contentType.properties) return;

    const groupsToCreate = new Set();
    
    // Check each property for group references
    for (const [propertyKey, property] of Object.entries(contentType.properties)) {
        if (property.group && !existingGroups[property.group]) {
            groupsToCreate.add(property.group);
        }
    }

    // Create missing groups
    for (const groupKey of groupsToCreate) {
        const created = await createPropertyGroup(groupKey);
        if (created) {
            existingGroups[groupKey] = { key: groupKey };
        }
    }
}

/**
 * Strip fields not accepted by the API from a content type definition
 * @param {object} contentTypeDefinition - Raw content type definition
 * @returns {object} - Cleaned content type
 */
const BASE_TYPE_MAP = {
    'page': '_page',
    'component': '_component',
    'experience': '_experience',
    'section': '_section',
    'element': '_element',
    'media': '_media',
    'image': '_image',
    'video': '_video',
    'folder': '_folder',
};

function mapAllowedTypes(types) {
    if (!Array.isArray(types)) return types;
    return types.map(t => BASE_TYPE_MAP[t.toLowerCase()] ?? t);
}

function cleanArrayItem(item) {
    if (!item) return item;
    const clean = { ...item };
    // link cannot be a component contentType — promote to first-class type
    if (clean.type === 'component' && clean.contentType === 'link') {
        clean.type = 'link';
        delete clean.contentType;
    }
    if (clean.allowedTypes) clean.allowedTypes = mapAllowedTypes(clean.allowedTypes);
    if (clean.restrictedTypes) clean.restrictedTypes = mapAllowedTypes(clean.restrictedTypes);
    return clean;
}

function cleanProperty(prop) {
    const { editorSettings, ...p } = prop;

    // link cannot be a component contentType — promote to first-class type
    if (p.type === 'component' && p.contentType === 'link') {
        p.type = 'link';
        delete p.contentType;
    }

    // required is not allowed on component properties
    if (p.type === 'component' && p.required) delete p.required;

    // 'html' is not a valid format — it was a legacy richText marker
    if (p.format === 'html') delete p.format;

    // LinkCollection format is only valid for array+link, not array+component
    if (p.type === 'array' && p.format === 'LinkCollection' && p.items?.type === 'component') {
        delete p.format;
    }

    // enum used to be stored as {values: [...]} — API expects the array directly
    if (p.enum && !Array.isArray(p.enum) && Array.isArray(p.enum.values)) {
        p.enum = p.enum.values;
    }

    if (p.allowedTypes) p.allowedTypes = mapAllowedTypes(p.allowedTypes);
    if (p.restrictedTypes) p.restrictedTypes = mapAllowedTypes(p.restrictedTypes);
    if (p.items) p.items = cleanArrayItem(p.items);

    return p;
}

function cleanContentTypeDefinition(contentTypeDefinition) {
    const clean = { ...contentTypeDefinition };
    if (clean.source || clean.source === '') delete clean.source;
    if (clean.features) delete clean.features;
    if (clean.usage) delete clean.usage;
    if (clean.lastModifiedBy) delete clean.lastModifiedBy;
    if (clean.lastModified) delete clean.lastModified;
    if (clean.created) delete clean.created;

    if (clean.baseType && BASE_TYPE_MAP[clean.baseType]) {
        clean.baseType = BASE_TYPE_MAP[clean.baseType];
    }

    if (clean.properties) {
        clean.properties = Object.fromEntries(
            Object.entries(clean.properties).map(([k, v]) => [k, cleanProperty(v)])
        );
    }
    return clean;
}

/**
 * Upsert a content type: create if new, patch if existing
 * @param {string} key - Content type key
 * @param {object} contentType - Content type definition
 * @returns {Promise<void>}
 */
async function upsertContentType(key, contentType, retries = 3) {
    let exists = false;
    try {
        await client.contentTypes.contentTypesGet(key);
        exists = true;
    } catch (e) {
        if (!e.status || e.status !== 404) throw e;
    }
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (exists) {
                await client.contentTypes.contentTypesPatch(key, contentType, true);
            } else {
                await client.contentTypes.contentTypesCreate(contentType);
            }
            return;
        } catch (e) {
            const retryable = e.status === 502 || e.status === 503 || e.status === 429;
            if (!retryable || attempt === retries) throw e;
            const delay = (e.body?.retry_after ?? 60) * 1000;
            console.log(`  ⚠️ ${e.status} received, retrying in ${delay / 1000}s (attempt ${attempt}/${retries})...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// Get command line argument for specific type
const typeNameArg = process.argv[2];

// Main execution
(async () => {
    if (typeNameArg) {
        console.log(`Starting content type push for: ${typeNameArg}...`);
        
        // Find specific type file
        const files = await processFiles('*.opti-type.json');
        const targetFile = files.find(file => {
            const filename = path.basename(file);
            return filename === `${typeNameArg}.opti-type.json`;
        });

        if (!targetFile) {
            console.log(`❌ Content type file "${typeNameArg}.opti-type.json" not found`);
            process.exit(1);
        }

        // Read the content type definition
        const contentTypeDefinition = await tryReadJsonFile(targetFile);
        if (contentTypeDefinition === undefined || !contentTypeDefinition.key) {
            console.log(`❌ Invalid content type definition in ${targetFile}`);
            process.exit(1);
        }

        const contentTypeKey = contentTypeDefinition.key;
        const baseType = contentTypeDefinition.baseType;
        const displayName = contentTypeDefinition.displayName;
        
        // Get existing property groups
        console.log('Fetching property groups...');
        const existingGroups = await getPropertyGroups();
        
        // Ensure all required property groups exist
        await ensurePropertyGroups(contentTypeDefinition, existingGroups);
        
        const cleanContentType = cleanContentTypeDefinition(contentTypeDefinition);

        try {
            await upsertContentType(contentTypeKey, cleanContentType);
            console.log(
                `✅ Content type "${displayName}" (${contentTypeKey}) of baseType ${baseType} has been updated`
            );
        } catch (e) {
            console.log(`❌ Error while trying to update ${contentTypeKey} from ${targetFile}`);
            console.log(`Error Details: ${e.message}`, e.body ? JSON.stringify(e.body, null, 2) : '');
            process.exit(1);
        }
    } else {
        console.log('Starting content type push for all types...');
        
        // Find all opti-type.json files
        const files = await processFiles('*.opti-type.json');
        console.log(`Found ${files.length} content type definition files`);
        
        // Get existing property groups
        console.log('Fetching property groups...');
        const existingGroups = await getPropertyGroups();
        
        // Track results for summary
        const results = {
            success: 0,
            failed: 0,
            skipped: 0
        };

        // Process each file
        for (const file of files) {
            // Read the content type definition
            const contentTypeDefinition = await tryReadJsonFile(file);
            if (contentTypeDefinition === undefined || !contentTypeDefinition.key) {
                console.log(`Invalid content type definition in ${file}`);
                results.skipped++;
                continue;
            }

            const contentTypeKey = contentTypeDefinition.key;
            const baseType = contentTypeDefinition.baseType;
            const displayName = contentTypeDefinition.displayName;
            
            // Ensure all required property groups exist for this content type
            await ensurePropertyGroups(contentTypeDefinition, existingGroups);
            
            const cleanContentType = cleanContentTypeDefinition(contentTypeDefinition);

            try {
                await upsertContentType(contentTypeKey, cleanContentType);
                console.log(
                    `✅ Content type "${displayName}" (${contentTypeKey}) of baseType ${baseType} has been updated`
                );
                results.success++;
            } catch (e) {
                console.log(`❌ Error while trying to update ${contentTypeKey} from ${file}`);
                console.log(`Error Details: ${e.message}`, e.body ? JSON.stringify(e.body, null, 2) : '');
                results.failed++;
            }
        }

        // Display summary
        console.log('\nContent type push summary:');
        console.log(`✅ Successfully updated: ${results.success}`);
        console.log(`❌ Failed to update: ${results.failed}`);
        console.log(`⚠️ Skipped: ${results.skipped}`);
    }
    console.log('Done!');
})().catch(err => {
    console.error('Unhandled error during execution:', err);
    process.exit(1);
});
