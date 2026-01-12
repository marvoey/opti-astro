const parsedPayload = {
    event_name: 'content_preview_requested',
    data: {
        assets: {
            articles: [],
            images: [],
            videos: [],
            raw_files: [],
            structured_contents: [
                {
                    id: 'ccbd232113ee430abc13e000fbd4fb58',
                    version_id: '6274786067054f9fa5fea213a0155e09',
                    title: 'Unveiling the Power of Trend Vision One™: Your AI-Powered Shield Against Cyber Threats',
                    created_at: '2026-01-06T10:50:57',
                    modified_at: '2026-01-06T10:50:57',
                    content_body: {
                        root_content: true,
                        title: 'Unveiling the Power of Trend Vision One™: Your AI-Powered Shield Against Cyber Threats',
                        primary_locale: 'en_US',
                        expired: false,
                        expiry_datetime: null,
                        source: null,
                        source_id: null,
                        source_metadata: null,
                        content_guid: 'ccbd232113ee430abc13e000fbd4fb58',
                        created_by: '68c88071bb6b052a11face62',
                        updated_by: '68c88071bb6b052a11face62',
                        created_at: '2026-01-06T10:50:57',
                        updated_at: '2026-01-06T10:50:57',
                        content_type_guid: '39e120e81df942348f121f844aef6c65',
                        content_type_name: 'Saas CMS Content',
                        content_type: {
                            name: 'Saas CMS Content',
                            description: '',
                            api_identifier: 'saas_cms_content',
                            thumbnail_guid: null,
                            component: false,
                            disabled: false,
                            default_locale: 'en',
                            latest_version_sequence: null,
                            content_type_guid:
                                '39e120e81df942348f121f844aef6c65',
                            created_by: '68c88071bb6b052a11face62',
                            updated_by: '68c88071bb6b052a11face62',
                            created_at: '2025-12-12T17:29:56',
                            updated_at: '2025-12-12T17:31:07',
                            source: null,
                            source_id: null,
                            source_metadata: null,
                            links: {
                                self: 'https://api.welcomesoftware.com/v3/structured-content/content-types/39e120e81df942348f121f844aef6c65',
                                versions:
                                    'https://api.welcomesoftware.com/v3/structured-content/content-types/39e120e81df942348f121f844aef6c65/versions',
                            },
                            version: {
                                version_guid:
                                    'c2c10a11ec9945e5870d9823d8f085ae',
                                created_by: '68c88071bb6b052a11face62',
                                created_at: '2025-12-12T17:29:56',
                                latest: true,
                                version_sequence: 1,
                                expected_locales: ['en_US'],
                                links: {
                                    content_type:
                                        'https://api.welcomesoftware.com/v3/structured-content/content-types/39e120e81df942348f121f844aef6c65',
                                    self: 'https://api.welcomesoftware.com/v3/structured-content/content-types/39e120e81df942348f121f844aef6c65/versions/c2c10a11ec9945e5870d9823d8f085ae',
                                },
                                field_definitions: [
                                    {
                                        core: {
                                            key: 'webpage',
                                            name: 'Webpage Analytics',
                                            is_list: false,
                                            is_required: false,
                                            need_internationalization: false,
                                            min_list_length: 0,
                                            max_list_length: -1,
                                            field_type: 'content-type',
                                            source_id: null,
                                            source_metadata: null,
                                            order_index: 0,
                                            help_text: null,
                                            editor_metadata: null,
                                        },
                                        allowed_content_types: [
                                            '5ed85a4bb9464238b8f892baed7de453',
                                        ],
                                        ref_type: 3,
                                        allow_ref_edit: true,
                                        content_type_links: {
                                            '5ed85a4bb9464238b8f892baed7de453':
                                                {
                                                    name: 'Webpage Analytics',
                                                    url: '/v0/instance/68f14361eed1bced7af06985/content-type/5ed85a4bb9464238b8f892baed7de453',
                                                },
                                        },
                                        default_value: null,
                                    },
                                    {
                                        core: {
                                            key: 'heading',
                                            name: 'Heading',
                                            is_list: false,
                                            is_required: false,
                                            need_internationalization: false,
                                            min_list_length: 1,
                                            max_list_length: -1,
                                            field_type: 'text-field',
                                            source_id: null,
                                            source_metadata: null,
                                            order_index: 1,
                                            help_text: null,
                                            editor_metadata: null,
                                        },
                                        validation_pattern: '.*',
                                        min_length: 0,
                                        max_length: -1,
                                        default_values: null,
                                    },
                                    {
                                        core: {
                                            key: 'subHeading',
                                            name: 'SubHeading',
                                            is_list: false,
                                            is_required: false,
                                            need_internationalization: false,
                                            min_list_length: 1,
                                            max_list_length: -1,
                                            field_type: 'text-field',
                                            source_id: null,
                                            source_metadata: null,
                                            order_index: 2,
                                            help_text: null,
                                            editor_metadata: null,
                                        },
                                        validation_pattern: '.*',
                                        min_length: 0,
                                        max_length: -1,
                                        default_values: null,
                                    },
                                    {
                                        core: {
                                            key: 'body',
                                            name: 'Body',
                                            is_list: false,
                                            is_required: false,
                                            need_internationalization: false,
                                            min_list_length: 1,
                                            max_list_length: -1,
                                            field_type: 'rich-text',
                                            source_id: null,
                                            source_metadata: null,
                                            order_index: 3,
                                            help_text: null,
                                            editor_metadata: null,
                                        },
                                        min_visual_text_length: 0,
                                        max_visual_text_length: -1,
                                        default_values: null,
                                    },
                                    {
                                        core: {
                                            key: 'featuredImage',
                                            name: 'Featured Image',
                                            is_list: false,
                                            is_required: false,
                                            need_internationalization: false,
                                            min_list_length: 1,
                                            max_list_length: -1,
                                            field_type: 'library-asset',
                                            source_id: null,
                                            source_metadata: null,
                                            order_index: 4,
                                            help_text: null,
                                            editor_metadata: null,
                                        },
                                        allowed_types: [
                                            'article',
                                            'image',
                                            'video',
                                            'raw_file',
                                        ],
                                        default_values: null,
                                    },
                                    {
                                        core: {
                                            key: 'referenceField',
                                            name: 'reference field',
                                            is_list: false,
                                            is_required: false,
                                            need_internationalization: false,
                                            min_list_length: 1,
                                            max_list_length: -1,
                                            field_type: 'content-type',
                                            source_id: null,
                                            source_metadata: null,
                                            order_index: 5,
                                            help_text: null,
                                            editor_metadata: null,
                                        },
                                        allowed_content_types: [
                                            '300f0789cb6748da9386865629cba5e8',
                                        ],
                                        ref_type: 2,
                                        allow_ref_edit: false,
                                        content_type_links: {
                                            '300f0789cb6748da9386865629cba5e8':
                                                {
                                                    name: 'CMS Content',
                                                    url: '/v0/instance/68f14361eed1bced7af06985/content-type/300f0789cb6748da9386865629cba5e8',
                                                },
                                        },
                                        default_value: null,
                                    },
                                ],
                                content_type_version_hash:
                                    '9ddf22d1e408d184fa59a677bb15a8518848f3b3d58c6ffece0a6edbd934a7cad05a2c40f6516f4a330f050b395217c1',
                            },
                        },
                        fields_version: {
                            fields: {
                                heading: [
                                    {
                                        locale: 'en_US',
                                        field_values: [
                                            {
                                                order_index: 0,
                                                text_value:
                                                    'Unveiling the Power of Trend Vision One™: Your AI-Powered Shield Against Cyber Threats',
                                            },
                                        ],
                                    },
                                ],
                                subHeading: [
                                    {
                                        locale: 'en_US',
                                        field_values: [
                                            {
                                                order_index: 0,
                                                text_value:
                                                    "In today's rapidly evolving digital landscape, businesses face an unprecedented array of cyber threats. To combat these sophisticated attacks, organizations need a comprehensive, intelligent, and proactive security solution. Enter the **Trend Vision One™ Platform**, Trend Micro's cutting-edge AI-Powered Enterprise Cybersecurity Platform, designed to deliver complete, proactive security and empower businesses to predict, prevent, detect, and respond to threats faster than ever before.",
                                            },
                                        ],
                                    },
                                ],
                                body: [
                                    {
                                        locale: 'en_US',
                                        field_values: [
                                            {
                                                order_index: 0,
                                                rich_text_value:
                                                    "<p>The Trend Vision One™ Platform is more than just a security product; it's a unified ecosystem that bridges threat protection and cyber risk management. By integrating a wide range of security functions, it provides unparalleled visibility and control across your entire digital estate.</p>\n<h3>Key Pillars of Protection with Trend Vision One™:</h3>\n<p><strong>1. Cyber Risk Exposure Management (CREM):</strong>\nProactively identify, assess, and mitigate risks to significantly reduce your cyber risk footprint. Trend Vision One™ leads in Exposure Management, transforming cyber risk visibility into decisive, proactive security measures.</p>\n<p><strong>2. Security Operations (SecOps):</strong>\nElevate your security operations with swift threat hunting, detection, investigation, and response capabilities. Leveraging Extended Detection and Response (XDR), Agentic SIEM, and Agentic SOAR, the platform offers unrivaled visibility into your security posture.</p>\n<p><strong>3. Comprehensive Cloud Security:</strong>\nSimplify your cloud security strategy and accelerate your hybrid cloud journey. As a trusted cloud security platform, it includes XDR for Cloud, Workload Security, Container Security, File Security, and robust Cloud Risk Management, ensuring your cloud environments are secure from development to deployment.</p>\n<p><strong>4. Advanced Endpoint Security:</strong>\nSecure every endpoint with centralized visibility, threat correlation, and rapid response. Trend Vision One™ defends your endpoints through every stage of an attack, incorporating XDR for Endpoint and Workload Security for robust protection.</p>\n<p><strong>5. Unparalleled Network Security:</strong>\nGain deep network insight, detect unknown threats, and protect unmanaged devices. The platform expands the power of XDR with Network Detection and Response (NDR), Network Intrusion Prevention (IPS), Zero Trust Secure Access (ZTSA), AI Secure Access, 5G Network Security, and Industrial Network Security.</p>\n<p><strong>6. Email and Collaboration Security:</strong>\nStay ahead of phishing, Business Email Compromise (BEC), ransomware, and scams with AI-powered email security. Trend Vision One™ stops threats with speed, ease, and accuracy, protecting your most critical communication channels.</p>\n<p><strong>7. Robust Identity Security:</strong>\nAchieve complete visibility, smart prioritization, and automated mitigation to prevent identity breaches. It offers end-to-end identity security, from posture management to detection and response.</p>\n<p><strong>8. Proactive AI Security:</strong>\nProtect your AI stacks with proactive security measures, eliminating vulnerabilities before they can be exploited by attackers.</p>\n<p><strong>9. Data Security:</strong>\nEnsure comprehensive protection for sensitive data across on-premises and cloud environments. Pre-empt data leaks with centralized visibility, intelligent risk prioritization, and rapid response capabilities.</p>\n<p><strong>10. Empowered by Threat Intelligence:</strong>\nBenefit from over 30 years of threat intelligence, continuously enhanced by AI, providing invaluable insights into adversary tactics and techniques.</p>\n<h3>The Business Advantage:</h3>\n<p>The adoption of Trend Vision One™ translates into tangible benefits for businesses:</p>\n<ul>\n<li><strong>Faster Threat Response:</strong> Predict, prevent, detect, and respond to threats more quickly, minimizing potential damage.</li>\n<li><strong>Complete Proactive Security:</strong> A comprehensive and proactive approach ensures all bases are covered.</li>\n<li><strong>Enhanced Risk Resilience:</strong> Monitor, prioritize, and neutralize threats effectively, building a more resilient security posture.</li>\n<li><strong>Optimized Security Operations:</strong> Streamlined operations for swift threat hunting, investigation, and response.</li>\n<li><strong>Eliminate Blind Spots &amp; Achieve Compliance:</strong> Full visibility across your infrastructure helps lower risk and simplifies compliance efforts.</li>\n<li><strong>Innovation Catalyst:</strong> Transform security from a cost center into an enabler of innovation by automating mitigation and optimizing resources.</li>\n</ul>\n<p>Trend Vision One™ is not just a product; it's a strategic partner in your cybersecurity journey, ensuring your enterprise remains secure, resilient, and ready for the future.</p>\n",
                                            },
                                        ],
                                    },
                                ],
                            },
                            created_by: '68c88071bb6b052a11face62',
                            source_id: null,
                            source_metadata: null,
                            created_at: '2026-01-06T10:51:29',
                            version_guid: '6274786067054f9fa5fea213a0155e09',
                            content_type_version_guid:
                                'c2c10a11ec9945e5870d9823d8f085ae',
                            content_hash:
                                '67628e3d7b9a98d26f6fbc8062caa3f169d79d8a8284f414f66bd5c39d4b5960bf97f617f66f32d83a9bff2f9094be91',
                            validation: null,
                        },
                    },
                },
            ],
        },
        organization: {
            id: '68f14361eed1bced7af06985',
        },
        preview_id: 'd5f2a6fd2fa54cf18bc172b238f9e99c',
        task: {
            id: '694abe201a768058175c2be8',
            links: {
                self: 'https://api.welcomesoftware.com/v3/tasks/694abe201a768058175c2be8',
            },
        },
        links: {
            acknowledge:
                'https://api.welcomesoftware.com/v3/structured-content/contents/ccbd232113ee430abc13e000fbd4fb58/versions/6274786067054f9fa5fea213a0155e09/previews/d5f2a6fd2fa54cf18bc172b238f9e99c/acknowledge',
            complete:
                'https://api.welcomesoftware.com/v3/structured-content/contents/ccbd232113ee430abc13e000fbd4fb58/versions/6274786067054f9fa5fea213a0155e09/previews/d5f2a6fd2fa54cf18bc172b238f9e99c/complete',
        },
    },
};
