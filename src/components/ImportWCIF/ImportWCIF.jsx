import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import XLSX from 'xlsx';
import {
  personWcifFromRegistrationXlsx,
  roundWcifFromXlsx,
} from '../../logic/xlsx-utils';
import CompetitionsList from '../Auth/CompetitionsList';
import { getOauthTokenIfAny } from '../../logic/auth';

//import tmpWcif from '../../wcifresults.json';

const useStyles = makeStyles(theme => ({
  input: {
    display: 'none',
  },
  h: {
    marginBottom: theme.spacing(3),
  },
  h6: {
    marginBottom: theme.spacing(1),
  },
  mt3: {
    marginTop: theme.spacing(3),
  },
  button: {
    marginLeft: theme.spacing(3),
  },
}));

const loadSheetIntoWcif = (wcif, name, jsonSheet) => {
  // This function strongly assumes that 'Registration' is the first sheet...
  if (name === 'Registration') {
    wcif.name = jsonSheet[0][0];
    wcif.shortName = wcif.name;
    wcif.persons = personWcifFromRegistrationXlsx(jsonSheet);
  } else {
    // Cubecomps export numbers for round identification, CubingChina exports
    // the roundTypeId.
    let eventId = name.split('-')[0];
    let event = wcif.events.find(e => e.id === eventId);
    if (!event) {
      event = {
        id: eventId,
        rounds: [],
        competitorLimit: null,
        qualification: null,
      };
      wcif.events.push(event);
    }
    let roundNumber = event.rounds.length + 1;
    event.rounds.push(
      roundWcifFromXlsx(wcif.persons, eventId, roundNumber, jsonSheet)
    );
  }
};

const xlsxOptions = {
  header: 1,
  raw: false,
  blankrows: false,
};

const handleXlsxUploadChange = (updater, event) => {
  const reader = new FileReader();
  const rABS = !!reader.readAsBinaryString;

  reader.onload = e => {
    const wb = XLSX.read(e.target.result, { type: rABS ? 'binary' : 'array' });
    const sheetNames = wb.SheetNames;
    const wcif = {
      // Unfortunately this is not included in the XLSX :(
      id: null,
      name: '<undefined>',
      shortName: '<undefined>',
      schedule: [],
      events: [],
      persons: [],
    };
    sheetNames.forEach(name =>
      loadSheetIntoWcif(
        wcif,
        name,
        XLSX.utils.sheet_to_json(wb.Sheets[name], xlsxOptions)
      )
    );
    updater(wcif);
  };

  reader.onerror = e => alert("Couldn't load the JSON file");

  if (rABS) reader.readAsBinaryString(event.target.files[0]);
  else reader.readAsArrayBuffer(event.target.files[0]);
};

const handleFileUploadChange = (updater, event) => {
  let reader = new FileReader();

  reader.onload = e => updater(JSON.parse(e.target.result));

  reader.onerror = e => alert("Couldn't load the JSON file");

  reader.readAsText(event.target.files[0]);
};

const ImportWCIF = ({ handleWcifJSONLoad }) => {
  const classes = useStyles();
  const userToken = getOauthTokenIfAny();

  // Dirty hack to preload given WCIF
  //handleWcifJSONLoad(tmpWcif);
  return (
    <Grid container justify="center">
      <Grid item xs={12} md={8} lg={6} xl={6} style={{ padding: 16 }}>
        <Paper style={{ padding: 16 }}>
          <Typography
            variant="h2"
            component="h1"
            align="center"
            className={classes.h}
          >
            Scrambles Matcher
          </Typography>
          <Typography paragraph>
            This tool enables you to assign sets of JSON scrambles generated by
            TNoodle to a WCIF. You can either import an existing WCIF or import
            a results spreadsheet (created by cubecomps) that will be converted
            to a WCIF.
          </Typography>
          <Typography color="error" style={{ fontWeight: 'bold' }}>
            There is currently no check whatsoever on the imported data.
            <br />
            If you upload incomplete results, or the wrong file on the wrong
            place, the application will simply crash.
            <br />
            If you refresh the page, you will have to start over.
          </Typography>
          <Grid
            container
            direction="column"
            justify="center"
            alignItems="center"
            className={classes.h6}
          >
            <Typography variant="h6" className={classes.h6}>
              Get started:
            </Typography>
            <Grid
              container
              direction="row"
              justify="center"
              className={classes.h6}
            >
              <input
                accept=".json"
                className={classes.input}
                id="raised-button-file"
                multiple
                type="file"
                onChange={ev => handleFileUploadChange(handleWcifJSONLoad, ev)}
              />
              <label htmlFor="raised-button-file">
                <Button
                  component="span"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                >
                  Upload WCIF
                </Button>
              </label>
              <input
                accept=".xlsx"
                className={classes.input}
                id="raised-button-xlsx"
                multiple
                type="file"
                onChange={ev => handleXlsxUploadChange(handleWcifJSONLoad, ev)}
              />
              <label htmlFor="raised-button-xlsx">
                <Button
                  component="span"
                  variant="contained"
                  color="primary"
                  className={classes.button}
                >
                  Upload XLSX
                </Button>
              </label>
            </Grid>
            <Typography variant="h6" className={classes.h6}>
              Or select a competition you manage on the WCA website:
            </Typography>
            <CompetitionsList
              userToken={userToken}
              setCompetitionWcif={() => alert('coucou')}
            />
          </Grid>
          <Typography paragraph className={classes.mt3}>
            You are most likely used to using the Workbook Assistant (WA). For
            competition where everything went well and you just have one single
            and comprehensive JSON scrambles file, then using this should be
            almost like using the WA.
            <br />
            If you have had to edit manually some scrambles JSON because of
            Multiple Blindfolded, or if you have had to combine multiple
            scrambles JSONs, read on! Here is a non exhaustive list of
            differences:
          </Typography>
          <Typography variant="h6">Additions</Typography>
          <ul>
            <li>
              "Better" scrambles matching.
              <br />
              The WA re-assigns automatically scrambles each time you upload a
              separate scrambles JSON. Even if you already matched a round to
              its corresponding set in the already uploaded scrambles. Scrambles
              Matcher assigns on-demand, and will only try to associate rounds
              which have no scrambles to scrambles from the uploaded JSON(s).
            </li>
            <li>
              Better Drag and Drop for scrambles.
              <br />
              If you have moved scrambles around in the WA you know what I'm
              talking about.
            </li>
            <li>
              Native support for attempt-based event.
              <br />
              Namely Multiple Blindfolded and Fewest Moves. When importing
              scrambles JSON(s) it will split scramble sheets for these events
              into attempt, so that they can be matched (manually or
              automatically) to the attempt they have actually been used for.
              <br />
              Especially useful if you had to generate a couple of extra
              scrambles for Multiple Blindfolded, or simply if you used several
              groups for that event.
              <br />
              Then for the results JSON they are grouped together in a
              meaningful way for the WCA website.
            </li>
            <li>
              No more 100MB database download, no more java, just a html page to
              load. However this leads to a missing feature (for now), see
              below.
            </li>
          </ul>
          <Typography variant="h6">Missing feature</Typography>
          <ul>
            <li>
              No more newcomers check. It does mean you will have to upload the
              results to the WCA website first, as it will validate the list of
              competitors. Since you can download the Results JSON even if you
              don't have assigned scrambles, you should be able to check
              newcomers even before going through scrambles assignment.
            </li>
          </ul>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ImportWCIF;
