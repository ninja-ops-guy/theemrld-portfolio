"""Run both real browser apps on one origin. Prerequisites before the rooftop are seeded."""
import json
import os
import subprocess
import sys
import tempfile
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright

portfolio = Path(__file__).resolve().parents[1]
native = Path(sys.argv[1]).resolve()
commit = lambda path: subprocess.check_output(["git", "-C", path, "rev-parse", "HEAD"], text=True).strip()


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


with tempfile.TemporaryDirectory() as directory:
    Path(directory, 'techops-hero').symlink_to(native, target_is_directory=True)
    Path(directory, 'theemrld-portfolio').symlink_to(portfolio / 'public', target_is_directory=True)
    with ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=directory)) as server:
        Thread(target=server.serve_forever, daemon=True).start()
        origin = f'http://127.0.0.1:{server.server_port}'
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=['--no-sandbox'])
            context = browser.new_context(viewport={'width': 1280, 'height': 820})
            context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(origin + '/') else route.abort())
            errors = []
            game = context.new_page()
            see = context.new_page()
            for page in [game, see]:
                page.on('pageerror', lambda error: errors.append(str(error)))
            native_url = origin + '/techops-hero/'
            see_url = origin + '/theemrld-portfolio/see-world/index.html'
            snapshot = "() => JSON.parse(localStorage.getItem('techops:linked:snapshot:v1'))"
            game.goto(native_url, wait_until='domcontentloaded')
            game.wait_for_function('TechOpsProductionTitleExperience?.state().ready === true')
            game.locator('#btn-start').click()
            game.locator('#dlg-options button').filter(has_text='Standard').click()
            game.locator('#dlg-options button').filter(has_text='Clock in').click()
            game.wait_for_function(f'() => !!({snapshot})()')
            first = game.evaluate(snapshot)
            see.goto(see_url + '#iona')
            expect(see.get_by_role('heading', name='Story Timeline')).to_be_visible()
            assert see.get_by_role('heading', name='Undiscovered story', exact=False).count() == 4
            assert 'Felicia' not in see.locator('body').inner_text()
            game.evaluate("""() => {
                // Establish only the prerequisites. The reveal below uses the authored button.
                const c = TechOpsCampaign, a = TechOpsCampaignAct2, state = c.load(localStorage);
                for (const [ticket, owner] of [['shipping_cannot_print', 'mike'],
                    ['plating_workstation_down', 'amit'], ['impossible_access_event', 'security']]) c.assignTicket(state, ticket, owner);
                c.completeStandup(state);
                c.completeWorkstation(state, {redInTheMirrorHeard: true, feliciaVideoSeen: true});
                c.recordGhostEvidence(state, {id: 'badge_impossible_access', perspective: 'delegated_verified', discoveredBy: 'security'});
                c.enterSector04(state); c.insightAccessGuard(state); c.severAccessController(state); c.transitionToTuesday(state);
                TechOpsStory.syncAct1State(state); a.beginGhostFrequency(state);
                a.recordBadgeClonerEvidence(state, {physicalArtifact: true, auditContradiction: true, perspective: 'delegated_verified'});
                a.firstDaylightFeliciaConversation(state, {approach: 'professional'});
                a.recordMorningstarTrace(state, {component: 'telemetry', source: 'trace_bay', verified: true});
                a.recordRooftopViolinEvidence(state, {signalObserved: true, corroborated: true});
                c.save(state, localStorage);
                closeDlg(); S.day = 2; setupDay(); closeDlg(); save();
                TechOpsCampaignNativeAct2.rooftop();
            }""")
            assert 'violinist_revealed' not in game.evaluate(snapshot)['milestones']
            game.get_by_role('button', name='Recognize Felicia').click()
            reveal = game.evaluate(snapshot)
            assert 'violinist_revealed' in reveal['milestones'] and 'act_6' not in reveal['milestones']
            assert reveal['playthroughId'] == first['playthroughId']
            expect(see.get_by_role('heading', name='A Signal Is Not a Confession')).to_be_visible()
            see.get_by_role('button', name='Begin campaign →').click()
            see.locator('[data-choice="capture-baseline"]').click()
            see.locator('[data-choice="independent-clock"]').click()
            expect(see.get_by_role('heading', name='The quiet crossing')).to_be_visible()
            see.reload()
            expect(see.get_by_role('heading', name='The quiet crossing')).to_be_visible()
            game.wait_for_function('() => !!window.TechOpsNightRuntime')
            game.evaluate('''() => {
                closeDlg(); enterNight();
                if (window.v722?.active?.()) window.v722.skip();
            }''')
            game.wait_for_function('() => TechOpsNightRuntime.active(TechOpsNightRuntime.world())')
            assert game.evaluate('() => TechOpsNightRuntime.openCampaign()')
            expect(game.locator('#dlg-name')).to_have_text('NIGHT WALKER // CAMPAIGN')
            game.get_by_role('button', name='Open linked Story Timeline').click()
            expect(game.locator('#dlg-text')).to_contain_text('Felicia signal investigation')
            expect(game.locator('#dlg-text')).to_contain_text('awaiting content')
            assert 'duet_protocol_complete' not in game.evaluate(snapshot)['milestones']
            game.reload(wait_until='domcontentloaded')
            game.wait_for_function('TechOpsProductionTitleExperience?.state().ready === true')
            game.locator('#btn-continue').click()
            assert game.evaluate(snapshot)['playthroughId'] == first['playthroughId']
            game.reload(wait_until='domcontentloaded')
            game.wait_for_function('TechOpsProductionTitleExperience?.state().ready === true')
            game.locator('#btn-start').click()
            game.locator('#dlg-options button').filter(has_text='Standard').click()
            game.wait_for_function(f'old => !!({snapshot})() && ({snapshot})().playthroughId !== old', arg=first['playthroughId'])
            assert game.evaluate(snapshot)['profileId'] == first['profileId']
            expect(see.get_by_role('heading', name='Story Timeline')).to_be_visible()
            assert see.get_by_role('heading', name='Undiscovered story', exact=False).count() == 4
            assert not errors, errors
            print(json.dumps({
                'status': 'passed', 'browser': browser.version, 'native': commit(native), 'portfolio': commit(portfolio),
                'scope': 'Fixture-assisted, same-origin real browser runtimes. Native reveal, persistence, See World choices, Night Walker journal, Continue and New Game. No destination content or section completion.'
            }, indent=2))
            browser.close()
