import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the OpenAPI YAML spec
const yamlFile = readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8');
const swaggerSpec = YAML.parse(yamlFile);

// Custom Swagger UI options for premium look
const swaggerUiOptions = {
    customSiteTitle: 'Grace ERP — API Docs',
    customfavIcon: '/api-docs/favicon.png',
    customCss: `
        /* ─── Base Reset ─── */
        * { box-sizing: border-box; }

        body {
            background: #0a0e1a !important;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
        }

        /* ─── Top Bar ─── */
        .swagger-ui .topbar {
            background: linear-gradient(135deg, #0f1729 0%, #1a2340 50%, #0d1421 100%) !important;
            border-bottom: 1px solid rgba(99, 102, 241, 0.3) !important;
            padding: 12px 20px !important;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5) !important;
        }

        .swagger-ui .topbar-wrapper .link {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
        }

        .swagger-ui .topbar-wrapper .link::before {
            content: '🏫 Grace ERP System' !important;
            font-size: 1.2rem !important;
            font-weight: 700 !important;
            color: #a5b4fc !important;
            letter-spacing: 0.5px !important;
        }

        .swagger-ui .topbar-wrapper img { display: none !important; }

        /* ─── Main Wrapper ─── */
        .swagger-ui {
            background: #0a0e1a !important;
            color: #e2e8f0 !important;
        }

        .swagger-ui .wrapper {
            max-width: 1300px !important;
            padding: 0 20px !important;
        }

        /* ─── Info Block ─── */
        .swagger-ui .info {
            background: linear-gradient(135deg, #0f1729, #1a2340) !important;
            border: 1px solid rgba(99, 102, 241, 0.25) !important;
            border-radius: 16px !important;
            padding: 32px !important;
            margin: 24px 0 !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }

        .swagger-ui .info .title {
            color: #a5b4fc !important;
            font-size: 2rem !important;
            font-weight: 800 !important;
            letter-spacing: -0.5px !important;
            text-shadow: 0 0 30px rgba(165, 180, 252, 0.3) !important;
        }

        .swagger-ui .info .title small {
            background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
            color: white !important;
            padding: 3px 10px !important;
            border-radius: 20px !important;
            font-size: 0.65rem !important;
            font-weight: 600 !important;
            vertical-align: middle !important;
            margin-left: 8px !important;
        }

        .swagger-ui .info p, .swagger-ui .info li {
            color: #94a3b8 !important;
            line-height: 1.7 !important;
        }

        .swagger-ui .info a { color: #818cf8 !important; }

        .swagger-ui .info code {
            background: rgba(99,102,241,0.15) !important;
            color: #a5b4fc !important;
            padding: 2px 8px !important;
            border-radius: 6px !important;
            font-size: 0.85em !important;
        }

        /* ─── Server Block ─── */
        .swagger-ui .servers {
            background: rgba(15, 23, 42, 0.7) !important;
            border: 1px solid rgba(99, 102, 241, 0.15) !important;
            border-radius: 12px !important;
            padding: 16px !important;
        }

        .swagger-ui .servers select {
            background: #1e293b !important;
            color: #e2e8f0 !important;
            border: 1px solid rgba(99, 102, 241, 0.3) !important;
            border-radius: 8px !important;
            padding: 8px 12px !important;
        }

        /* ─── Tags (Section Headers) ─── */
        .swagger-ui .opblock-tag {
            background: linear-gradient(90deg, rgba(99,102,241,0.12), rgba(139,92,246,0.05)) !important;
            border: 1px solid rgba(99, 102, 241, 0.2) !important;
            border-radius: 12px !important;
            margin: 8px 0 !important;
            transition: all 0.2s ease !important;
        }

        .swagger-ui .opblock-tag:hover {
            border-color: rgba(99, 102, 241, 0.5) !important;
            background: linear-gradient(90deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1)) !important;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15) !important;
        }

        .swagger-ui .opblock-tag a, .swagger-ui .opblock-tag span {
            color: #c7d2fe !important;
            font-size: 1rem !important;
            font-weight: 700 !important;
        }

        .swagger-ui .opblock-tag small {
            color: #64748b !important;
            font-size: 0.8rem !important;
        }

        /* ─── Operation Blocks ─── */
        .swagger-ui .opblock {
            border-radius: 10px !important;
            margin: 6px 0 !important;
            border: none !important;
            overflow: hidden !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }

        /* GET */
        .swagger-ui .opblock-get {
            background: rgba(16, 185, 129, 0.05) !important;
            border-left: 4px solid #10b981 !important;
        }
        .swagger-ui .opblock-get .opblock-summary-method {
            background: linear-gradient(135deg, #059669, #10b981) !important;
        }

        /* POST */
        .swagger-ui .opblock-post {
            background: rgba(99, 102, 241, 0.05) !important;
            border-left: 4px solid #6366f1 !important;
        }
        .swagger-ui .opblock-post .opblock-summary-method {
            background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
        }

        /* PUT */
        .swagger-ui .opblock-put {
            background: rgba(245, 158, 11, 0.05) !important;
            border-left: 4px solid #f59e0b !important;
        }
        .swagger-ui .opblock-put .opblock-summary-method {
            background: linear-gradient(135deg, #d97706, #f59e0b) !important;
        }

        /* PATCH */
        .swagger-ui .opblock-patch {
            background: rgba(20, 184, 166, 0.05) !important;
            border-left: 4px solid #14b8a6 !important;
        }
        .swagger-ui .opblock-patch .opblock-summary-method {
            background: linear-gradient(135deg, #0d9488, #14b8a6) !important;
        }

        /* DELETE */
        .swagger-ui .opblock-delete {
            background: rgba(239, 68, 68, 0.05) !important;
            border-left: 4px solid #ef4444 !important;
        }
        .swagger-ui .opblock-delete .opblock-summary-method {
            background: linear-gradient(135deg, #dc2626, #ef4444) !important;
        }

        /* Method Badge */
        .swagger-ui .opblock-summary-method {
            border-radius: 6px !important;
            font-weight: 700 !important;
            font-size: 0.72rem !important;
            letter-spacing: 1px !important;
            min-width: 70px !important;
            text-align: center !important;
            padding: 6px 12px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }

        /* Summary Text */
        .swagger-ui .opblock-summary-description {
            color: #cbd5e1 !important;
            font-size: 0.9rem !important;
        }

        .swagger-ui .opblock-summary-path {
            color: #a5b4fc !important;
            font-weight: 600 !important;
            font-family: 'Fira Code', 'Cascadia Code', monospace !important;
            font-size: 0.88rem !important;
        }

        .swagger-ui .opblock-summary {
            background: transparent !important;
            border-bottom: 1px solid rgba(255,255,255,0.04) !important;
            padding: 12px 16px !important;
        }

        /* Expanded body */
        .swagger-ui .opblock-body {
            background: rgba(10, 14, 26, 0.8) !important;
        }

        /* ─── Models / Schema ─── */
        .swagger-ui .model-box {
            background: rgba(15, 23, 42, 0.9) !important;
            border: 1px solid rgba(99, 102, 241, 0.15) !important;
            border-radius: 8px !important;
        }

        .swagger-ui .model-title {
            color: #a5b4fc !important;
            font-weight: 700 !important;
        }

        .swagger-ui .model {
            color: #94a3b8 !important;
        }

        /* Schema types */
        .swagger-ui .model span.prop-type { color: #818cf8 !important; }
        .swagger-ui .model span.prop-format { color: #64748b !important; }

        /* ─── Parameters ─── */
        .swagger-ui table thead tr th {
            color: #94a3b8 !important;
            background: rgba(15, 23, 42, 0.9) !important;
            border-bottom: 1px solid rgba(99, 102, 241, 0.2) !important;
            font-weight: 600 !important;
            font-size: 0.8rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }

        .swagger-ui table tbody tr td {
            color: #cbd5e1 !important;
            background: rgba(10, 14, 26, 0.5) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
        }

        .swagger-ui .parameter__name { color: #a5b4fc !important; font-weight: 600 !important; }
        .swagger-ui .parameter__type { color: #818cf8 !important; }
        .swagger-ui .parameter__in { color: #64748b !important; font-size: 0.75rem !important; }

        /* Required badge */
        .swagger-ui .parameter__name.required span {
            color: #f87171 !important;
        }

        /* ─── Request Body ─── */
        .swagger-ui .opblock-section-header {
            background: rgba(15, 23, 42, 0.9) !important;
            border-bottom: 1px solid rgba(99, 102, 241, 0.15) !important;
        }

        .swagger-ui .opblock-section-header h4 {
            color: #a5b4fc !important;
            font-weight: 700 !important;
            font-size: 0.85rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
        }

        /* ─── Responses ─── */
        .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 {
            color: #94a3b8 !important;
        }

        .swagger-ui .response-col_status { color: #a5b4fc !important; font-weight: 700 !important; }
        .swagger-ui .response-col_description { color: #cbd5e1 !important; }

        /* ─── Code blocks ─── */
        .swagger-ui .highlight-code pre,
        .swagger-ui .microlight,
        .swagger-ui code {
            background: rgba(10, 14, 26, 0.95) !important;
            color: #a5b4fc !important;
            border-radius: 8px !important;
            font-family: 'Fira Code', 'Cascadia Code', monospace !important;
            font-size: 0.82rem !important;
            border: 1px solid rgba(99, 102, 241, 0.15) !important;
        }

        /* JSON syntax colors */
        .swagger-ui .microlight .number { color: #fb923c !important; }
        .swagger-ui .microlight .string { color: #86efac !important; }
        .swagger-ui .microlight .keyword { color: #c084fc !important; }

        /* ─── Authorize button ─── */
        .swagger-ui .btn.authorize {
            background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
            color: white !important;
            border: none !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            padding: 8px 20px !important;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4) !important;
            transition: all 0.2s ease !important;
        }

        .swagger-ui .btn.authorize:hover {
            box-shadow: 0 6px 25px rgba(99, 102, 241, 0.6) !important;
            transform: translateY(-1px) !important;
        }

        .swagger-ui .btn.authorize svg { fill: white !important; }

        /* Try it out + Execute */
        .swagger-ui .btn.try-out__btn {
            background: rgba(99, 102, 241, 0.15) !important;
            border: 1px solid rgba(99, 102, 241, 0.4) !important;
            color: #a5b4fc !important;
            border-radius: 6px !important;
            font-weight: 600 !important;
            transition: all 0.2s !important;
        }
        .swagger-ui .btn.try-out__btn:hover {
            background: rgba(99, 102, 241, 0.25) !important;
        }

        .swagger-ui .btn.execute {
            background: linear-gradient(135deg, #059669, #10b981) !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4) !important;
        }

        .swagger-ui .btn.cancel {
            background: rgba(239, 68, 68, 0.1) !important;
            border: 1px solid rgba(239, 68, 68, 0.3) !important;
            color: #f87171 !important;
            border-radius: 6px !important;
        }

        /* ─── Inputs in try-it-out ─── */
        .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {
            background: #1e293b !important;
            color: #e2e8f0 !important;
            border: 1px solid rgba(99, 102, 241, 0.3) !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            transition: border-color 0.2s !important;
        }
        .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus {
            border-color: #6366f1 !important;
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
        }

        /* ─── Auth Modal ─── */
        .swagger-ui .dialog-ux .modal-ux {
            background: #0f1729 !important;
            border: 1px solid rgba(99, 102, 241, 0.3) !important;
            border-radius: 16px !important;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7) !important;
        }

        .swagger-ui .dialog-ux .modal-ux-header {
            background: linear-gradient(135deg, #1a2340, #0f1729) !important;
            border-bottom: 1px solid rgba(99, 102, 241, 0.2) !important;
            border-radius: 16px 16px 0 0 !important;
        }

        .swagger-ui .dialog-ux .modal-ux-header h3 {
            color: #a5b4fc !important;
            font-weight: 700 !important;
        }

        .swagger-ui .dialog-ux .modal-ux-content {
            background: #0f1729 !important;
            color: #94a3b8 !important;
        }

        /* Close button */
        .swagger-ui .dialog-ux .modal-ux-header button {
            color: #94a3b8 !important;
        }

        /* ─── Scheme Selector ─── */
        .swagger-ui .scheme-container {
            background: rgba(10, 14, 26, 0.8) !important;
            border-bottom: 1px solid rgba(99, 102, 241, 0.15) !important;
            box-shadow: none !important;
            padding: 12px 20px !important;
        }

        /* ─── Lock icon ─── */
        .swagger-ui .opblock-summary-control svg { fill: #94a3b8 !important; }

        /* ─── Response code colors ─── */
        .swagger-ui .response-col_status .response-undocumented { color: #94a3b8 !important; }
        .swagger-ui table.responses-table .response td:first-child {
            font-weight: 700 !important;
            font-family: monospace !important;
        }

        /* Scrollbars */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0a0e1a; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }

        /* ─── Loading animation ─── */
        .swagger-ui .loading-container .loading::after {
            border-color: #6366f1 transparent transparent transparent !important;
        }
    `,
    swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: false,
        persistAuthorization: true,
        displayRequestDuration: true,
        syntaxHighlight: {
            activate: true,
            theme: 'monokai'
        }
    }
};

export { swaggerSpec, swaggerUiOptions, swaggerUi };
